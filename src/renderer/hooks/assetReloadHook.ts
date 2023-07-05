import { useEffect } from 'react';
import {
    AssetService,
    BlockTargetProvider,
    BlockTypeProvider,
    ResourceTypeProvider,
} from '@kapeta/ui-web-context';

export const useAssetReload = () => {
    useEffect(() => {
        return AssetService.subscribe((evt) => {
            if (['added', 'removed'].indexOf(evt.payload.type) === -1) {
                return; // We don't care about updated here
            }

            const ref = `${evt.payload.asset.handle}/${evt.payload.asset.name}:${evt.payload.asset.version}`;

            if (evt.payload.type === 'removed') {
                console.log('REMOVED', evt.payload);
                switch (evt.payload.definition.kind) {
                    case 'core/deployment-target': // Unused locally
                        return;
                    case 'core/block-type':
                    case 'core/block-type-operator':
                        if (!BlockTypeProvider.exists(ref)) {
                            return;
                        }
                        break;
                    case 'core/language-target':
                        if (!BlockTargetProvider.exists(ref)) {
                            return;
                        }
                        break;
                    case 'core/resource-type-operator':
                    case 'core/resource-type-internal':
                    case 'core/resource-type-extension':
                        if (!ResourceTypeProvider.exists(ref)) {
                            return;
                        }
                        break;
                    default:
                        return;
                }
                // Reload - something was removed that we care about
                window.location.reload();
                return;
            }

            if (evt.payload.type === 'added') {
                console.log('ADDED', evt.payload);
                switch (evt.payload.definition.kind) {
                    case 'core/deployment-target': // Unused locally
                        return;
                    case 'core/block-type':
                    case 'core/block-type-operator':
                        if (BlockTypeProvider.exists(ref)) {
                            return;
                        }
                        break;
                    case 'core/language-target':
                        if (BlockTargetProvider.exists(ref)) {
                            return;
                        }
                        break;
                    case 'core/resource-type-operator':
                    case 'core/resource-type-internal':
                    case 'core/resource-type-extension':
                        if (ResourceTypeProvider.exists(ref)) {
                            return;
                        }
                        break;
                    default:
                        return;
                }
                // Reload - something was added that we care about
                window.location.reload();
            }
        });
    });
};
