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
import { useAsync } from 'react-use';
import { AssetService } from '@kapeta/ui-web-context';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { useKapetaContext } from '../../../hooks/contextHook';
import { versionIsBigger } from '../../../utils/versionHelpers';
import { Asset } from '@kapeta/ui-web-types';

interface Props {
    handle?: string;
}

export const BlockhubShell = (props: Props) => {
    const kapetaContext = useKapetaContext();

    const [currentCategory, setCurrentCategory] = useState<BlockhubCategory>(
        BlockhubCategory.INSTALLED
    );

    const assets = useAsync(async () => {
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
                onFilterChange={(category: BlockhubCategory) => {
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
            />
        </ThemeProvider>
    );
};
