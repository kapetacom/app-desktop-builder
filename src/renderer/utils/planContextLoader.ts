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
} from '@kapeta/ui-web-types';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';
import { Plan, Resource } from '@kapeta/schemas';
import Kapeta from '../kapeta';
import { AsyncState } from 'react-use/lib/useAsyncFn';

const PROVIDER_CACHE = {};
const BLOCK_CACHE = {};

export function normalizeKapetaUri(uri: string) {
    if (!uri) {
        return '';
    }

    return `kapeta://${parseKapetaUri(uri).id}`;
}

const registerMissing = () => {
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
        }
    );
};

export const loadProvider = async (providerKind: string) => {
    if (PROVIDER_CACHE[providerKind]) {
        return;
    }

    const uri = parseKapetaUri(providerKind);
    const path = `/providers/asset/${uri.handle}/${uri.name}/${uri.version}/web.js`;
    const scriptElm = document.createElement('script');
    scriptElm.setAttribute('src', clusterPath(path));
    const loaderPromise = new Promise((resolve) => {
        scriptElm.addEventListener('load', resolve);
        scriptElm.addEventListener('error', resolve);
    });
    document.body.appendChild(scriptElm);
    // eslint-disable-next-line no-await-in-loop
    await loaderPromise;
    registerMissing();
    PROVIDER_CACHE[providerKind] = true;
};

function parseVersion(a: string) {
    return a.split('.').map((v) => parseInt(v, 10));
}

function versionIsBigger(a: string, b: string) {
    const aVersion = parseVersion(a);
    const bVersion = parseVersion(b);

    for (let i = 0; i < aVersion.length; i++) {
        if (aVersion[i] > bVersion[i]) {
            return true;
        }
        if (aVersion[i] < bVersion[i]) {
            return false;
        }
    }

    return false;
}

const fetchLocalProviders = () => {
    return simpleFetch(clusterPath(`/providers`));
};

export const useAssets = () => {
    return useAsync(async () => {
        return await AssetService.list();
    }, []);
};

export const useBlockKinds = (assets: AsyncState<Asset[]>): Set<string> => {
    return useMemo(() => {
        if (!assets.value) {
            return new Set<string>();
        }

        return new Set<string>(
            assets.value
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
    }, [assets.value]);
};

export const useBlockAssets = (
    assets: AsyncState<Asset[]>,
    blockTypeKinds: Set<string>
): Asset[] => {
    return useMemo(() => {
        if (!assets.value) {
            return [];
        }
        return assets.value.filter((asset) => {
            // Only blocks do not have a core kind
            return (
                asset.exists &&
                blockTypeKinds.has(parseKapetaUri(asset.kind).fullName)
            );
        });
    }, [assets.value]);
};

export const useLoadedPlanContext = (plan: Plan | undefined) => {
    const [currentlyLoading, setCurrentlyLoading] = useState('');

    const assets = useAssets();
    const blockTypeKinds = useBlockKinds(assets);
    const blockAssets = useBlockAssets(assets, blockTypeKinds);

    const localProviderRefs = useAsync(async () => {
        const providers = await fetchLocalProviders();
        return providers.map((provider) => {
            return `${provider.definition.metadata.name}:${provider.version}`;
        });
    }, [plan]);

    const blockRefs = useMemo(() => {
        const refs = new Set<string>();
        if (!plan || !blockAssets) {
            return refs;
        }

        plan.spec?.blocks?.forEach((block) => {
            refs.add(block.block.ref);
        });

        blockAssets.forEach((asset) => {
            refs.add(asset.ref);
        });

        return refs;
    }, [plan, blockAssets]);

    const resourceAssets = useAsync(async (): Promise<
        IResourceTypeProvider[] | null
    > => {
        const providerKinds = new Set<string>();
        if (!blockAssets || !localProviderRefs.value) {
            // Return null to indicate that we are still loading
            return null;
        }

        localProviderRefs.value.forEach((ref) => providerKinds.add(ref));

        let promises = Array.from(blockRefs).map(async (blockRef) => {
            if (BLOCK_CACHE[blockRef]) {
                return;
            }
            const blockUri = parseKapetaUri(blockRef);
            let block = blockAssets?.find((asset) =>
                parseKapetaUri(asset.ref).equals(blockUri)
            );
            if (!block) {
                // Will also cause installation if not already installed
                block = await BlockService.get(blockRef);
                setCurrentlyLoading(blockRef);
            }
            BLOCK_CACHE[blockRef] = true;
            if (!block) {
                return;
            }
            providerKinds.add(block.data.kind);
            const eachResource = (resource: Resource) => {
                providerKinds.add(resource.kind);
            };
            block.data.spec?.providers?.forEach(eachResource);
            block.data.spec?.consumers?.forEach(eachResource);
            if (block.data.spec?.target?.kind) {
                providerKinds.add(block.data.spec.target.kind);
            }
        });

        await Promise.allSettled(promises);

        promises = Array.from(providerKinds).map(async (ref) => {
            await loadProvider(ref);
            setCurrentlyLoading(ref);
        });

        await Promise.allSettled(promises);

        return ResourceTypeProvider.list();
    }, [
        blockRefs,
        assets.loading,
        assets.value,
        localProviderRefs.loading,
        localProviderRefs.value,
    ]);

    return {
        resourceAssets: resourceAssets.value,
        currentlyLoading,
        blocks: blockAssets,
        loading:
            assets.loading ||
            resourceAssets.loading ||
            localProviderRefs.loading ||
            !resourceAssets.value,
        error: assets.error || resourceAssets.error || localProviderRefs.error,
    };
};
