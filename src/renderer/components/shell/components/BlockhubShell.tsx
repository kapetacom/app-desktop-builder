import { kapetaLight } from '../../../Theme';
import { installerService } from '../../../api/installerService';
import { api, assetFetcher } from '../../../api/APIService';
import { ThemeProvider } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { BlockhubCategory, BlockhubModal } from '@kapeta/ui-web-components';
import { useAsync } from 'react-use';
import { AssetService } from '@kapeta/ui-web-context';
import { parseKapetaUri } from '@kapeta/nodejs-utils';

interface Props {
    open: boolean;
    handle?: string;
    onClose: () => void;
}

export const BlockhubShell = (props: Props) => {
    const [currentCategory, setCurrentCategory] = useState<BlockhubCategory>(
        BlockhubCategory.INSTALLED
    );

    const assets = useAsync(async () => {
        switch (currentCategory) {
            case BlockhubCategory.INSTALLED:
                const all = await api.registry().list();
                const installedAssets = await AssetService.list();
                return all.filter((asset) =>
                    installedAssets.some((installed) => {
                        const installedUri = parseKapetaUri(installed.ref);
                        const assetUri = parseKapetaUri(
                            asset.content.metadata.name + ':' + asset.version
                        );
                        return assetUri.equals(installedUri);
                    })
                );
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
        if (props.open) {
            setCurrentCategory(BlockhubCategory.INSTALLED);
        }
    }, [props.open]);

    return (
        <ThemeProvider theme={kapetaLight}>
            <BlockhubModal
                open={props.open}
                installerService={installerService}
                fetcher={assetFetcher}
                assets={assets}
                onFilterChange={(category: BlockhubCategory) => {
                    setCurrentCategory(category);
                }}
                onClose={() => {
                    props.onClose();
                }}
            />
        </ThemeProvider>
    );
};
