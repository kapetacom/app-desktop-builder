import { AssetService } from './AssetService';
import { Asset } from '@kapeta/ui-web-types';
import { BlockDefinition } from '@kapeta/schemas';
import { BlockStore, BlockTypeProvider } from '@kapeta/ui-web-context';

class BlockServiceImpl implements BlockStore {
    async list(): Promise<Asset<BlockDefinition>[]> {
        const assets = await AssetService.list();
        return assets.filter((asset) => {
            return asset.exists && BlockTypeProvider.exists(asset.kind);
        });
    }

    async get(ref: string): Promise<Asset<BlockDefinition>> {
        return AssetService.get(ref);
    }
}

export const BlockService = new BlockServiceImpl();
