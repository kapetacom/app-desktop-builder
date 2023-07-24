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
    IBlockTypeProvider,
    ILanguageTargetProvider,
    IResourceTypeProvider,
} from '@kapeta/ui-web-types';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';
import { Plan, Resource } from '@kapeta/schemas';
import Kapeta from '../kapeta';

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

export const useBlockAssets = () => {
    return useAsync(async () => {
        const assets = await AssetService.list();
        return assets.filter((a) => a.kind !== 'core/plan');
    }, []);
};

export const useLoadedPlanContext = (plan: Plan | undefined) => {
    const [currentlyLoading, setCurrentlyLoading] = useState('');

    const blockAssets = useBlockAssets();

    const localProviderRefs = useAsync(async () => {
        const providers = await fetchLocalProviders();
        return providers.map((provider) => {
            return `${provider.definition.metadata.name}:${provider.version}`;
        });
    }, [plan]);

    const blockRefs = useMemo(() => {
        const blockKinds = new Set<string>();
        if (!plan || !blockAssets.value) {
            return blockKinds;
        }

        plan.spec?.blocks?.forEach((block) => {
            blockKinds.add(block.block.ref);
        });

        blockAssets.value.forEach((asset) => {
            blockKinds.add(asset.ref);
        });

        return blockKinds;
    }, [plan, blockAssets.value]);

    const resourceAssets = useAsync(async (): Promise<
        IResourceTypeProvider[] | null
    > => {
        const providerKinds = new Set<string>();
        if (!blockAssets.value || !localProviderRefs.value) {
            // Return null to indicate that we are still loading
            return null;
        }

        localProviderRefs.value.forEach((ref) => providerKinds.add(ref));

        let promises = Array.from(blockRefs).map(async (blockRef) => {
            if (BLOCK_CACHE[blockRef]) {
                return;
            }
            const blockUri = parseKapetaUri(blockRef);
            let block = blockAssets.value?.find((asset) =>
                parseKapetaUri(asset.ref).equals(blockUri)
            );
            if (!block) {
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
        blockAssets.loading,
        blockAssets.value,
        localProviderRefs.loading,
        localProviderRefs.value,
    ]);

    return {
        resourceAssets: resourceAssets.value,
        currentlyLoading,
        blocks: blockAssets.value,
        loading:
            blockAssets.loading ||
            resourceAssets.loading ||
            localProviderRefs.loading ||
            !resourceAssets.value,
        error:
            blockAssets.error ||
            resourceAssets.error ||
            localProviderRefs.error,
    };
};
