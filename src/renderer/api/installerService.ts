import { InstallerService } from '@kapeta/ui-web-components';
import { Asset } from '@kapeta/ui-web-types';
import { AssetService } from '@kapeta/ui-web-context';

export const installerService: InstallerService = {
    get(assetRef: string): Promise<Asset> {
        return AssetService.get(assetRef, false);
    },
    async install(assetRef: string): Promise<void> {
        await AssetService.install(assetRef);
    },
};
