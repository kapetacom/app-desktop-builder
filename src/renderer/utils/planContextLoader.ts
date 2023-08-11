import {
    AssetService,
    BlockService,
    BlockTargetProvider,
    BlockTypeProvider,
    clusterPath,
    ResourceTypeProvider,
    simpleFetch,
} from '@kapeta/ui-web-context';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import _ from 'lodash';
import {
    Asset,
    IBlockTypeProvider,
    ILanguageTargetProvider,
    IResourceTypeProvider,
    SchemaKind,
} from '@kapeta/ui-web-types';
import { useEffect, useMemo, useState } from 'react';
import { useAsync } from 'react-use';
import { BlockDefinition, Plan, Resource } from '@kapeta/schemas';
import Kapeta from '../kapeta';
import { AsyncState } from 'react-use/lib/useAsyncFn';
import { AssetListResult, useAssets } from '../hooks/assetHooks';

type PromiseCache = { [key: string]: Promise<void> };
const PROVIDER_CACHE: PromiseCache = {};
const BLOCK_CACHE: PromiseCache = {};

export function normalizeKapetaUri(uri: string) {
    if (!uri) {
        return '';
    }

    return `kapeta://${parseKapetaUri(uri).id}`;
}

const registerMissing = () => {
    let loaded = 0;

    function getVersion(id: string) {
        return id.split(':')[1];
    }

    _.forEach(Kapeta.resourceTypes, (provider: IResourceTypeProvider, id) => {
        if (ResourceTypeProvider.exists(id)) {
            return;
        }

        if (!provider.version) {
            provider.version = getVersion(id);
        }
        console.log(
            'Registering resource type with version %s',
            provider.version,
            provider
        );
        ResourceTypeProvider.register(provider);
        loaded++;
    });

    _.forEach(Kapeta.blockTypes, (provider: IBlockTypeProvider, id) => {
        if (BlockTypeProvider.exists(id)) {
            return;
        }
        if (!provider.version) {
            provider.version = getVersion(id);
        }
        console.log(
            'Registering block type with version %s',
            provider.version,
            provider
        );
        BlockTypeProvider.register(provider);
        loaded++;
    });

    _.forEach(
        Kapeta.languageTargets,
        (provider: ILanguageTargetProvider, id) => {
            if (BlockTargetProvider.exists(id)) {
                return;
            }
            if (!provider.version) {
                provider.version = getVersion(id);
            }
            console.log(
                'Registering language target with version %s',
                provider.version,
                provider
            );
            BlockTargetProvider.register(provider);
            loaded++;
        }
    );

    return loaded;
};

const loadProvider = async (providerKind: string): Promise<void> => {
    return new Promise(async (resolve) => {
        try {
            const uri = parseKapetaUri(providerKind);
            const path = `/providers/asset/${uri.handle}/${uri.name}/${uri.version}/web.js`;
            const scriptElm = document.createElement('script');
            scriptElm.setAttribute('src', clusterPath(path));
            const loaderPromise = new Promise((scriptResolve) => {
                scriptElm.addEventListener('load', scriptResolve);
                scriptElm.addEventListener('error', scriptResolve);
            });
            document.body.appendChild(scriptElm);
            // eslint-disable-next-line no-await-in-loop
            await loaderPromise;
            const result = registerMissing();
        } catch (e) {
            console.warn('Failed to load provider', providerKind, e);
        } finally {
            resolve();
        }
    });
};

const fetchLocalProviders = () => {
    return simpleFetch(clusterPath(`/providers`));
};

export const useBlockKinds = (): Set<string> => {
    const assets = useAssets();

    return useMemo(() => {
        return new Set<string>(
            assets.data
                .filter((asset) => {
                    // Only blocks do not have a core kind
                    return (
                        asset.exists &&
                        [
                            'core/block-type',
                            'core/block-type-operator',
                        ].includes(asset.kind)
                    );
                })
                .map((asset) => {
                    return parseKapetaUri(asset.ref).fullName;
                })
        );
    }, [assets.data]);
};

function toBlocks(assets: Asset<any>[]): Asset<BlockDefinition>[] {
    return assets.filter((asset) => {
        // Only blocks do not have a core kind
        return asset.exists && !asset.kind.startsWith('core/');
    }) as Asset<BlockDefinition>[];
}

export const useLoadedPlanContext = (plan: Plan | undefined) => {
    const [currentlyLoading, setCurrentlyLoading] = useState('');
    const [loading, setLoading] = useState(true);

    const dependencyHash = useMemo(() => {
        if (!plan) {
            return '';
        }
        const deps = plan.spec?.blocks?.map((block) => block.block.ref) ?? [];
        return `${plan.metadata.name}:${deps.join(',')}`;
    }, [plan]);

    const assetResult = useAssets();
    const blocks = useMemo(() => {
        return toBlocks(assetResult.data ?? []);
    }, [assetResult.data]);

    const missingData = (!plan || !assetResult.data);

    const results = useAsync(async () => {
        if (missingData) {
            return;
        }
        const providerRefs = new Set<string>();
        const blockDefinitionRefs = new Set<string>();
        const providers = await fetchLocalProviders();
        providers.forEach((provider) => {
            providerRefs.add(
                `${provider.definition.metadata.name}:${provider.version}`
            );
        });

        if (plan) {
            plan.spec?.blocks?.forEach((block) => {
                blockDefinitionRefs.add(block.block.ref);
            });
        }

        blocks.forEach((asset) => {
            blockDefinitionRefs.add(asset.ref);
        });

        const blockDefinitionPromises = Array.from(blockDefinitionRefs).map(
            async (blockRef) => {
                blockRef = normalizeKapetaUri(blockRef);
                if (blockRef in BLOCK_CACHE) {
                    return BLOCK_CACHE[blockRef];
                }

                return (BLOCK_CACHE[blockRef] = new Promise(async (resolve) => {
                    try {
                        const blockUri = parseKapetaUri(blockRef);
                        let block = blocks?.find((asset) =>
                            parseKapetaUri(asset.ref).equals(blockUri)
                        );

                        if (!block) {
                            // Will also cause installation if not already installed
                            block = await BlockService.get(blockRef);
                            setCurrentlyLoading(blockRef);
                        }

                        if (!block) {
                            return;
                        }

                        providerRefs.add(block.data.kind);
                        const eachResource = (resource: Resource) => {
                            providerRefs.add(resource.kind);
                        };
                        block.data.spec?.providers?.forEach(eachResource);
                        block.data.spec?.consumers?.forEach(eachResource);
                        if (block.data.spec?.target?.kind) {
                            providerRefs.add(block.data.spec.target.kind);
                        }
                    } catch (e) {
                        console.warn('Failed to load block', blockRef, e);
                    } finally {
                        resolve();
                    }
                }));
            }
        );

        await Promise.allSettled(blockDefinitionPromises);

        const providerPromises = Array.from(providerRefs).map(async (ref) => {
            ref = normalizeKapetaUri(ref);
            if (ref in PROVIDER_CACHE) {
                return PROVIDER_CACHE[ref];
            }
            PROVIDER_CACHE[ref] = loadProvider(ref);
            setCurrentlyLoading(ref);
            return PROVIDER_CACHE[ref];
        });

        await Promise.allSettled(providerPromises);

        return {
            blocks,
            providers: ResourceTypeProvider.list(),
        };
    }, [
        dependencyHash,
        blocks,
        missingData
    ]);

    useEffect(() => {
        if (results.loading) {
            return;
        }
        setLoading(false);
    }, [results.loading]);

    return {
        missingData,
        resourceAssets: results.value?.providers ?? [],
        currentlyLoading,
        blocks: results.value?.blocks ?? [],
        loading: loading || missingData,
        error: results.error,
    };
};
