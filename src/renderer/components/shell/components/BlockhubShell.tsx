import { kapetaLight } from '../../../Theme';
import { installerService } from '../../../api/installerService';
import { api, assetFetcher } from '../../../api/APIService';
import { ThemeProvider } from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
    AssetDisplay,
    BlockhubCategory,
    BlockhubModal,
} from '@kapeta/ui-web-components';
import { useAsync, useAsyncRetry } from 'react-use';
import { AssetService } from '@kapeta/ui-web-context';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { useKapetaContext } from '../../../hooks/contextHook';
import { versionIsBigger } from '../../../utils/versionHelpers';
import { Asset } from '@kapeta/ui-web-types';
import { AssetThumbnail } from '../../AssetThumbnail';
import { normalizeKapetaUri } from '../../../utils/planContextLoader';
import { useAssetsChanged } from '../../../hooks/assetHooks';

interface Props {
    handle?: string;
}

export const BlockhubShell = (props: Props) => {
    const kapetaContext = useKapetaContext();

    const [currentCategory, setCurrentCategory] = useState<BlockhubCategory>(
        BlockhubCategory.INSTALLED
    );

    const assets = useAsyncRetry(async () => {
        switch (currentCategory) {
            case BlockhubCategory.INSTALLED:
                const all = await api.registry().list();
                const installedAssets = await AssetService.list();
                const latest: { [p: string]: Asset<any> } = {};

                installedAssets.forEach((installedAsset) => {
                    const uri = parseKapetaUri(installedAsset.ref);
                    if (latest[uri.fullName]) {
                        if (
                            versionIsBigger(
                                installedAsset.version,
                                latest[uri.fullName].version
                            )
                        ) {
                            latest[uri.fullName] = installedAsset;
                        }
                        return;
                    }
                    latest[uri.fullName] = installedAsset;
                    return;
                });

                return [
                    ...Object.values(latest).map(
                        (installedAsset): AssetDisplay<any> => {
                            const installedUri = parseKapetaUri(
                                installedAsset.ref
                            );
                            const asset = all.find((asset) => {
                                const assetUri = parseKapetaUri(
                                    asset.content.metadata.name +
                                        ':' +
                                        asset.version
                                );
                                return assetUri.equals(installedUri);
                            });

                            if (asset) {
                                return asset;
                            }

                            return {
                                content: installedAsset.data,
                                version: installedAsset.version,
                                readme: {
                                    content: 'Local Asset',
                                    type: 'text/markdown',
                                },
                            };
                        }
                    ),
                ];
            case BlockhubCategory.OWN:
                if (!props.handle) {
                    // Not logged in
                    return [];
                }
                return await api.registry().findByHandle(props.handle);
            case BlockhubCategory.COMMUNITY:
                return await api.registry().list();
        }
    }, [currentCategory, props.handle]);

    useAssetsChanged(
        (evt) => {
            if (
                evt.sourceOfChange === 'user' ||
                currentCategory !== BlockhubCategory.INSTALLED
            ) {
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
        <ThemeProvider theme={kapetaLight}>
            <BlockhubModal
                open={kapetaContext.blockHub.visible}
                installerService={installerService}
                plan={kapetaContext.blockHub.opener?.source}
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
                previewRenderer={(asset, size) => {
                    const assetRef = normalizeKapetaUri(
                        `${asset.content.metadata.name}:${asset.version}`
                    );
                    return (
                        <AssetThumbnail
                            width={size.width}
                            height={size.height}
                            hideMetadata={true}
                            asset={{
                                kind: asset.content.kind,
                                version: asset.version,
                                data: asset.content,
                                exists: true,
                                ref: assetRef,
                                editable: asset.version === 'local',
                                ymlPath: '',
                                path: '',
                            }}
                        />
                    );
                }}
            />
        </ThemeProvider>
    );
};
