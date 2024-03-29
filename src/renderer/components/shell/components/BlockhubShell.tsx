/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { useInstallerService } from '../../../api/installerService';
import { api, assetFetcher, AssetFilter } from '../../../api/APIService';
import React, { useEffect, useState } from 'react';
import { AssetDisplay, AssetType, BlockhubCategory, BlockhubModal } from '@kapeta/ui-web-components';
import { useAsyncRetry } from 'react-use';
import { normalizeKapetaUri, parseKapetaUri, parseVersion } from '@kapeta/nodejs-utils';
import { useKapetaContext } from '../../../hooks/contextHook';
import { useLoadedPlanContext } from '../../../utils/planContextLoader';
import { useAssetsChanged } from '../../../hooks/assetHooks';
import { AssetInfo, AssetThumbnail, fromAsset, fromAssetDisplay } from '@kapeta/ui-web-plan-editor';
import { AssetService } from '../../../api/AssetService';
import { useAssetImporter } from '../../../utils/useAssetImporter';

const COMMUNITY_FILTER: AssetFilter[] = [
    {
        type: 'public',
        value: 'true',
    },
];

interface Props {
    handle?: string;
}

export const BlockhubShell = (props: Props) => {
    const kapetaContext = useKapetaContext();

    const [currentCategory, setCurrentCategory] = useState<BlockhubCategory>(BlockhubCategory.INSTALLED);
    const [assetTypeFilter, setAssetTypeFilter] = useState<AssetType>('ALL');

    const localAssets = useAsyncRetry(async () => {
        const all = await api.registry().list();
        const installedAssets = await AssetService.list();
        const latest: { [p: string]: AssetInfo<any> } = {};

        installedAssets.forEach((installedAsset) => {
            const uri = parseKapetaUri(installedAsset.ref);
            if (latest[uri.fullName]) {
                if (parseVersion(installedAsset.version).isGreaterThan(parseVersion(latest[uri.fullName].version))) {
                    latest[uri.fullName] = fromAsset(installedAsset);
                }
                return;
            }
            latest[uri.fullName] = fromAsset(installedAsset);
        });

        return [
            ...Object.values(latest).map((installedAsset): AssetDisplay<any> => {
                const installedUri = parseKapetaUri(installedAsset.ref);
                const asset = all?.find((asset) => {
                    const assetUri = parseKapetaUri(`${asset.content.metadata.name}:${asset.version}`);
                    return assetUri.equals(installedUri);
                });

                if (asset) {
                    return asset;
                }

                return {
                    content: installedAsset.content,
                    version: installedAsset.version,
                    readme: {
                        content: 'Local Asset',
                        type: 'text/markdown',
                    },
                };
            }),
        ];
    }, []);

    const assets = useAsyncRetry(async () => {
        switch (currentCategory) {
            case BlockhubCategory.OWN:
                if (!props.handle) {
                    // Not logged in
                    return [];
                }
                return (await api.registry().findByHandle(props.handle)) || [];
            case BlockhubCategory.COMMUNITY:
                return (await api.registry().list(COMMUNITY_FILTER)) || [];
        }
    }, [currentCategory, props.handle]);

    useAssetsChanged(() => {
        // We only get notified of local changes
        localAssets.retry();
    }, [localAssets.retry]);

    useEffect(() => {
        if (kapetaContext.blockHub.visible) {
            setCurrentCategory(BlockhubCategory.INSTALLED);
        }
    }, [kapetaContext.blockHub.visible]);

    const installerService = useInstallerService();
    const assetImporter = useAssetImporter({
        assetService: AssetService,
    });

    return (
        <BlockhubModal
            open={kapetaContext.blockHub.visible}
            installerService={installerService}
            filter={assetTypeFilter}
            onFilterChange={setAssetTypeFilter}
            onAssetImport={() => assetImporter.importAsset()}
            plan={
                kapetaContext.blockHub.opener?.source
                    ? {
                          kind: kapetaContext.blockHub.opener?.source.content.kind,
                          data: kapetaContext.blockHub.opener?.source.content,
                          exists: !!kapetaContext.blockHub.opener?.source.exists,
                          editable: !!kapetaContext.blockHub.opener?.source.editable,
                          version: kapetaContext.blockHub.opener?.source.version,
                          path: '',
                          ymlPath: '',
                          ref: normalizeKapetaUri(kapetaContext.blockHub.opener?.source?.ref),
                      }
                    : undefined
            }
            fetcher={assetFetcher}
            assets={currentCategory === BlockhubCategory.INSTALLED ? localAssets : assets}
            category={currentCategory}
            onCategoryChange={(category: BlockhubCategory) => {
                setCurrentCategory(category);
            }}
            onSelect={(selection: AssetDisplay[]) => {
                if (kapetaContext.blockHub.opener?.callback) {
                    kapetaContext.blockHub.opener.callback(selection);
                }
            }}
            onClose={() => {
                kapetaContext.blockHub.close();
            }}
            previewRenderer={(asset, size) => {
                return (
                    <AssetThumbnail
                        width={size.width}
                        height={size.height}
                        hideMetadata={true}
                        loadPlanContext={(plan) => {
                            return useLoadedPlanContext(plan.content);
                        }}
                        asset={fromAssetDisplay(asset)}
                    />
                );
            }}
        />
    );
};
