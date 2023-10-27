import { InstallerService, AssetInstallStatus, AssetDisplay } from '@kapeta/ui-web-components';
import { onAssetChanged } from '../hooks/assetHooks';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { AssetService } from './AssetService';
import { useMemo } from 'react';

export const useInstallerService = () => {
    return useMemo((): InstallerService => {
        return {
            async get(assetRef: string): Promise<AssetInstallStatus> {
                const assetUri = parseKapetaUri(assetRef);
                if (assetUri.version === 'local') {
                    return AssetInstallStatus.INSTALLED;
                }

                const installedVersions = await AssetService.getVersions(assetUri.fullName);

                const installed = installedVersions.some((a) => a.version === assetUri.version);

                if (installed) {
                    return AssetInstallStatus.INSTALLED;
                }

                const hasOtherVersion = installedVersions.some((a) => {
                    return a.version !== 'local';
                });

                if (hasOtherVersion) {
                    return AssetInstallStatus.UPGRADABLE;
                }

                return AssetInstallStatus.NOT_INSTALLED;
            },
            async install(assetRef: string): Promise<void> {
                await AssetService.install(assetRef);
            },
            async uninstall(assetRef: string): Promise<void> {
                await AssetService.remove(assetRef);
            },
            onChange(assetRef, callback: () => void | Promise<void>) {
                const uri = parseKapetaUri(assetRef);

                return onAssetChanged(async (evt) => {
                    if (
                        evt.asset.handle === uri.handle ||
                        evt.asset.name === uri.name ||
                        evt.asset.version === uri.version
                    ) {
                        await callback();
                    }
                });
            },
        };
    }, []);
};
