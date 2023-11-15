import { BlockDefinition, Plan, resolveDependencies } from '@kapeta/schemas';
import { AssetInfo } from '@kapeta/ui-web-plan-editor/src/types';
import { useContext, useMemo, useState } from 'react';
import { useLocalAssets } from './assetHooks';
import { versionIsBigger } from '../utils/versionHelpers';
import { KapetaURI, parseKapetaUri } from '@kapeta/nodejs-utils';
import { SchemaKind } from '@kapeta/ui-web-types';
import { useLocalStorage } from 'react-use';
import { BlockDefinitionReference, PlannerContext } from '@kapeta/ui-web-plan-editor';
import { normalizeKapetaUri } from '../utils/planContextLoader';
import _ from 'lodash';

export type UpdateType = 'plan' | 'block';

export interface Update {
    name: string;
    fromVersion: string;
    toVersion: string;
    type: UpdateType;
    referenceType: string;
    asset: AssetInfo<SchemaKind>;
    reference: AssetInfo<SchemaKind>;
    path: string;
}

function createEmpty(loading: boolean): PlanUpdater {
    return {
        loading,
        updates: [],
        prompt: false,
        review: false,
        applyUpdates: async () => {},
        ignoreUpdates: () => {},
        showPrompt: () => {},
        showReview: () => {},
        hideReview: () => {},
    };
}

export interface PlanUpdater {
    loading: boolean;
    updates: Update[];
    prompt: boolean;
    review: boolean;
    showPrompt: () => void;
    showReview: () => void;
    hideReview: () => void;
    applyUpdates: (specificUpdates?: Update[]) => void;
    ignoreUpdates: () => void;
}

export const usePlanUpdater = (): PlanUpdater => {
    const [showReview, setShowReview] = useState(false);
    const planner = useContext(PlannerContext);
    const localAssets = useLocalAssets();
    const plan = planner.asset;
    const [ignoreUpdates, setIgnoreUpdates] = useLocalStorage(`$ignore-updates[${plan?.ref ?? 'unknown'}]`, false);

    return useMemo((): PlanUpdater => {
        if (!plan || plan?.version !== 'local') {
            return createEmpty(false);
        }

        if (localAssets.loading) {
            return createEmpty(true);
        }

        const latestAssetVersions: { [name: string]: string } = {};
        const assetMap: { [name: string]: AssetInfo<SchemaKind> } = {};
        localAssets.data.forEach((asset) => {
            const name = asset.content.metadata.name;
            assetMap[normalizeKapetaUri(asset.ref)] = asset;
            if (asset.version === 'local') {
                return;
            }

            if (!latestAssetVersions[name] || versionIsBigger(asset.version, latestAssetVersions[name])) {
                latestAssetVersions[name] = asset.version;
            }
        });

        const updates: Update[] = [];
        function checkForUpdate(
            uri: KapetaURI,
            referenceType: string,
            type: UpdateType,
            path: string,
            asset: AssetInfo<SchemaKind>
        ) {
            const ref = uri.toNormalizedString();
            if (
                assetMap[ref] &&
                latestAssetVersions[uri.fullName] &&
                latestAssetVersions[uri.fullName] !== uri.version
            ) {
                // There is a newer version of this asset available
                const reference = assetMap[ref];

                updates.push({
                    name: uri.fullName,
                    fromVersion: uri.version,
                    toVersion: latestAssetVersions[uri.fullName],
                    type,
                    referenceType,
                    asset,
                    reference,
                    path,
                });
            }
        }

        plan.content.spec.blocks.forEach((instance, instanceIx) => {
            const blockUri = parseKapetaUri(instance.block.ref);

            if (blockUri.version !== 'local') {
                checkForUpdate(blockUri, 'Blocks', 'plan', instance.id, plan);
                return;
            }

            const currentBlock = localAssets.data.find((asset) => {
                return asset.content.metadata.name === blockUri.fullName && asset.version === 'local';
            });

            if (!currentBlock) {
                console.warn('Could not find block in local assets', blockUri);
                return;
            }

            const blockTypeUri = parseKapetaUri(currentBlock.content.kind);

            const currentBlockType = localAssets.data.find((asset) => {
                return asset.content.metadata.name === blockTypeUri.fullName && asset.version !== blockTypeUri.version;
            });

            if (!currentBlockType) {
                console.warn('Could not find block type in local assets', blockTypeUri);
                return;
            }

            const dependencies = resolveDependencies(currentBlock.content, currentBlockType.content);

            dependencies.forEach((dep) => {
                checkForUpdate(parseKapetaUri(dep.name), dep.type, 'block', dep.path, currentBlock);
            });
        });

        return {
            loading: false,
            updates,
            prompt: !showReview && !ignoreUpdates && updates.length > 0,
            review: showReview,
            applyUpdates: (specificUpdates?: Update[]) => {
                if (!specificUpdates) {
                    specificUpdates = updates;
                }
                const planUpdates = specificUpdates.filter((update) => update.type === 'plan');
                const blockUpdates = specificUpdates.filter((update) => update.type === 'block');
                const blockUpdatesByAsset: { [blockRef: string]: Update[] } = {};
                blockUpdates.forEach((a, b) => {
                    if (!blockUpdatesByAsset[a.asset.ref]) {
                        blockUpdatesByAsset[a.asset.ref] = [];
                    }
                    blockUpdatesByAsset[a.asset.ref].push(a);
                });

                planUpdates.forEach((update) => {
                    planner.updateBlockInstance(update.path, (instance) => {
                        return {
                            ...instance,
                            block: {
                                ref: normalizeKapetaUri(`${update.name}:${update.toVersion}`),
                            },
                        };
                    });
                });

                const blockDefinitionRefs: BlockDefinitionReference[] = [];
                Object.entries(blockUpdatesByAsset).forEach(([blockRef, updates]) => {
                    const blockDefinition = planner.getBlockByRef(blockRef);
                    if (!blockDefinition) {
                        console.warn('Could not find block definition for', blockRef);
                        return;
                    }
                    const blockCopy = _.cloneDeep(blockDefinition);
                    updates.forEach((update) => {
                        const newRef = normalizeKapetaUri(`${update.name}:${update.toVersion}`);
                        _.set(blockCopy, update.path, newRef);
                    });

                    blockDefinitionRefs.push({
                        ref: blockRef,
                        update: blockCopy,
                    });
                });

                if (blockDefinitionRefs.length > 0) {
                    planner.updateBlockDefinitions(blockDefinitionRefs);
                }
            },
            showPrompt: () => {
                setIgnoreUpdates(false);
            },
            ignoreUpdates: () => {
                setIgnoreUpdates(true);
            },
            showReview: () => {
                setShowReview(true);
                setIgnoreUpdates(false);
            },
            hideReview: () => {
                setShowReview(false);
                setIgnoreUpdates(true);
            },
        };
    }, [
        planner,
        plan,
        showReview,
        setShowReview,
        localAssets.data,
        localAssets.loading,
        ignoreUpdates,
        setIgnoreUpdates,
    ]);
};
