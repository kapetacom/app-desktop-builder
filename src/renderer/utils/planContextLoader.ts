import {
    BlockService,
    BlockTargetProvider,
    BlockTypeProvider,
    clusterPath,
    ResourceTypeProvider,
    simpleFetch,
} from '@kapeta/ui-web-context';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import _ from 'lodash';
import { IBlockTypeProvider, ILanguageTargetProvider, IResourceTypeProvider, SchemaKind } from '@kapeta/ui-web-types';
import { useEffect, useMemo, useState } from 'react';
import { useAsync } from 'react-use';
import { BlockDefinition, Plan, Resource } from '@kapeta/schemas';
import Kapeta from '../kapeta';
import { useLocalAssets } from '../hooks/assetHooks';
import { AssetInfo, fromAsset, fromAssetDisplay } from '@kapeta/ui-web-plan-editor';
import { assetFetcher } from '../api/APIService';

type PromiseCache<T = void> = { [key: string]: Promise<T> };
const PROVIDER_CACHE: PromiseCache = {};
const BLOCK_CACHE: PromiseCache<AssetInfo<BlockDefinition> | null> = {};

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
        console.log('Registering resource type with version %s', provider.version, provider);
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
        console.log('Registering block type with version %s', provider.version, provider);
        BlockTypeProvider.register(provider);
        loaded++;
    });

    _.forEach(Kapeta.languageTargets, (provider: ILanguageTargetProvider, id) => {
        if (BlockTargetProvider.exists(id)) {
            return;
        }
        if (!provider.version) {
            provider.version = getVersion(id);
        }
        console.log('Registering language target with version %s', provider.version, provider);
        BlockTargetProvider.register(provider);
        loaded++;
    });

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

function toBlocks(assets: AssetInfo<SchemaKind>[]): AssetInfo<BlockDefinition>[] {
    return assets.filter((asset) => {
        // Only blocks do not have a core kind
        return asset.exists && !asset.content.kind.startsWith('core/');
    }) as AssetInfo<BlockDefinition>[];
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

    const localAssetsResult = useLocalAssets();
    const localBlocks = useMemo(() => {
        return !localAssetsResult.loading && localAssetsResult.data ? toBlocks(localAssetsResult.data) : undefined;
    }, [localAssetsResult.loading, localAssetsResult.data]);

    const missingData = !plan || !localAssetsResult.data || !localBlocks;
    const results = useAsync(async () => {
        if (missingData) {
            return;
        }
        const providerRefs = new Set<string>();
        const blockDefinitionRefs = new Set<string>();
        const providers = await fetchLocalProviders();
        providers.forEach((provider) => {
            providerRefs.add(`${provider.definition.metadata.name}:${provider.version}`);
        });

        if (plan) {
            plan.spec?.blocks?.forEach((block) => {
                blockDefinitionRefs.add(block.block.ref);
            });
        }

        localBlocks.forEach((asset) => {
            blockDefinitionRefs.add(asset.ref);
        });

        const blockDefinitionPromises = Array.from(blockDefinitionRefs).map(async (blockRef) => {
            const blockUri = parseKapetaUri(blockRef);
            blockRef = normalizeKapetaUri(blockRef);

            let localBlock = localBlocks?.find((asset) => parseKapetaUri(asset.ref).equals(blockUri));

            if (localBlock) {
                return localBlock;
            }

            if (blockRef in BLOCK_CACHE) {
                return BLOCK_CACHE[blockRef];
            }

            return (BLOCK_CACHE[blockRef] = new Promise<AssetInfo<BlockDefinition> | null>(async (resolve) => {
                try {
                    const block =
                        blockUri.version === 'local'
                            ? fromAsset(await BlockService.get(blockRef))
                            : fromAssetDisplay(await assetFetcher(blockUri.fullName, blockUri.version));
                    setCurrentlyLoading(blockRef);

                    if (!block) {
                        resolve(null);
                        return;
                    }

                    providerRefs.add(block.content.kind);
                    const eachResource = (resource: Resource) => {
                        providerRefs.add(resource.kind);
                    };
                    block.content.spec?.providers?.forEach(eachResource);
                    block.content.spec?.consumers?.forEach(eachResource);
                    if (block.content.spec?.target?.kind) {
                        providerRefs.add(block.content.spec.target.kind);
                    }
                    resolve(block);
                } catch (e) {
                    resolve(null);
                    console.warn('Failed to load block', blockRef, e);
                }
            }));
        });

        const allBlocks = await Promise.all(blockDefinitionPromises);

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
            blocks: allBlocks.filter((block) => block !== null) as AssetInfo<BlockDefinition>[],
            providers: ResourceTypeProvider.list(),
        };
    }, [dependencyHash, localBlocks, missingData]);

    useEffect(() => {
        if (results.loading && !missingData) {
            return;
        }
        setLoading(false);
    }, [results.loading, missingData]);

    return {
        missingData,
        resourceAssets: results.value?.providers ?? [],

        currentlyLoading,
        blocks: results.value?.blocks ?? [],
        loading: loading || missingData || !results.value?.blocks,
        error: results.error,
    };
};
