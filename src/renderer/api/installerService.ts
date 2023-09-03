import { InstallerService } from '@kapeta/ui-web-components';
import { onAssetChanged } from '../hooks/assetHooks';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { AssetService } from './AssetService';

export const installerService: InstallerService = {
    async get(assetRef: string): Promise<boolean> {
        const asset = await AssetService.get(assetRef, false);
        return !!asset;
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
            if (evt.asset.handle === uri.handle || evt.asset.name === uri.name || evt.asset.version === uri.version) {
                await callback();
            }
        });
    },
};
