import { useEffect, useState } from 'react';
import { AssetDisplay, AssetType, BlockhubCategory, BlockhubModal } from '@kapeta/ui-web-components';
import { useAsyncRetry } from 'react-use';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { AssetInfo, AssetThumbnail, fromAsset, fromAssetDisplay } from '@kapeta/ui-web-plan-editor';
import { AssetService } from 'renderer/api/AssetService';
import { useKapetaContext } from '../../../hooks/contextHook';
import { versionIsBigger } from '../../../utils/versionHelpers';

import { normalizeKapetaUri, useCurriedLoadedPlanContext } from '../../../utils/planContextLoader';
import { useAssetsChanged } from '../../../hooks/assetHooks';
import { api, assetFetcher } from '../../../api/APIService';
import { installerService } from '../../../api/installerService';

interface Props {
    handle?: string;
}

const PreviewLoader = (props: {
    children: (args: { planLoader: ReturnType<typeof useCurriedLoadedPlanContext> }) => JSX.Element;
}) => {
    const planLoader = useCurriedLoadedPlanContext();

    return props.children({ planLoader });
};

const previewRenderer = (asset, size) => {
    return (
        <PreviewLoader>
            {({ planLoader }) => (
                <AssetThumbnail
                    width={size.width}
                    height={size.height}
                    hideMetadata
                    loadPlanContext={(plan) => {
                        planLoader.setPlan(plan.content);
                        return planLoader.context;
                    }}
                    asset={fromAssetDisplay(asset)}
                />
            )}
        </PreviewLoader>
    );
};

export const BlockhubShell = (props: Props) => {
    const kapetaContext = useKapetaContext();

    const [currentCategory, setCurrentCategory] = useState<BlockhubCategory>(BlockhubCategory.INSTALLED);
    const [assetTypeFilter, setAssetTypeFilter] = useState<AssetType>('ALL');

    const assets = useAsyncRetry(async () => {
        switch (currentCategory) {
            case BlockhubCategory.INSTALLED: {
                const all = await api.registry().list();
                const installedAssets = await AssetService.list();
                const latest: { [p: string]: AssetInfo<any> } = {};

                installedAssets.forEach((installedAsset) => {
                    const uri = parseKapetaUri(installedAsset.ref);
                    if (latest[uri.fullName]) {
                        if (versionIsBigger(installedAsset.version, latest[uri.fullName].version)) {
                            latest[uri.fullName] = fromAsset(installedAsset);
                        }
                        return;
                    }
                    latest[uri.fullName] = fromAsset(installedAsset);
                });

                return [
                    ...Object.values(latest).map((installedAsset): AssetDisplay<any> => {
                        const installedUri = parseKapetaUri(installedAsset.ref);
                        const asset = all.find((assetDisplay) => {
                            const assetUri = parseKapetaUri(
                                `${assetDisplay.content.metadata.name}:${assetDisplay.version}`
                            );
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
            }
            case BlockhubCategory.OWN:
                if (!props.handle) {
                    // Not logged in
                    return [];
                }
                return api.registry().findByHandle(props.handle);
            case BlockhubCategory.COMMUNITY:
                return api.registry().list();
            default:
                return undefined;
        }
    }, [currentCategory, props.handle]);

    useAssetsChanged(
        (evt) => {
            if (evt.sourceOfChange === 'user' || currentCategory !== BlockhubCategory.INSTALLED) {
                return;
            }
            assets.retry();
        },
        [assets, currentCategory]
    );

    useEffect(() => {
        if (kapetaContext.blockHub.visible) {
            setCurrentCategory(BlockhubCategory.INSTALLED);
        }
    }, [kapetaContext.blockHub.visible]);

    return (
        <BlockhubModal
            open={kapetaContext.blockHub.visible}
            installerService={installerService}
            filter={assetTypeFilter}
            onFilterChange={setAssetTypeFilter}
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
            assets={assets}
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
            previewRenderer={previewRenderer}
        />
    );
};
