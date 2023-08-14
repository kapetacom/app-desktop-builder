import { InstallerService } from '@kapeta/ui-web-components';
import { Asset } from '@kapeta/ui-web-types';
import { AssetService, SocketService } from '@kapeta/ui-web-context';
import { onAssetChanged } from '../hooks/assetHooks';
import { parseKapetaUri } from '@kapeta/nodejs-utils';

export const installerService: InstallerService = {
    get(assetRef: string): Promise<Asset> {
        return AssetService.get(assetRef, false);
    },
    async install(assetRef: string): Promise<void> {
        await AssetService.install(assetRef);
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
