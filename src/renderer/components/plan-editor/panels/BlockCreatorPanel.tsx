import React, { useContext, useEffect, useState } from 'react';
import { BlockCreator, createNewBlock } from '../../creators/BlockCreator';
import { AssetCreatorState } from '../../creators/AssetCreator';
import { AssetService, BlockService } from '@kapeta/ui-web-context';
import { PlannerContext } from '@kapeta/ui-web-plan-editor';
import { useAsyncFn } from 'react-use';
import { BlockDefinition } from '@kapeta/schemas';
import { DataEntityType, EditItemInfo } from '../types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';

interface Props {
    open: boolean;
    info?: EditItemInfo | null;
    onClosed: () => void;
}

export const BlockCreatorPanel = (props: Props) => {
    const planner = useContext(PlannerContext);
    const [creatorState, setCreatorState] = useState(AssetCreatorState.CLOSED);

    useEffect(() => {
        setCreatorState(
            props.open ? AssetCreatorState.CREATING : AssetCreatorState.CLOSED
        );
    }, [props.open]);

    const [{ value: blocks, loading }, loadBlocks] = useAsyncFn(async () => {
        return BlockService.list();
    });

    useEffect(() => {
        loadBlocks().catch(() => {
            // Do nothing...
        });
    }, [loadBlocks]);

    return (
        <BlockCreator
            assetService={AssetService}
            state={creatorState}
            onStateChanged={setCreatorState}
            createNewKind={(): BlockDefinition => {
                if (props.info?.type !== DataEntityType.BLOCK) {
                    return createNewBlock();
                }

                return props.info.item.asset.data
                    ? { ...props.info?.item.asset.data }
                    : createNewBlock();
            }}
            onDone={() => {
                props.onClosed();
            }}
            onCancel={() => {
                if (props.info?.type !== DataEntityType.BLOCK) {
                    return;
                }
                planner.removeBlockInstance(props.info.item.instance.id);
                planner.removeBlockDefinition(props.info.item.asset);
                props.onClosed();
            }}
            onAssetAdded={(block) => {
                if (props.info?.type !== DataEntityType.BLOCK) {
                    return;
                }

                if (block.ref !== props.info.item.asset.ref) {
                    // If we changed the ref - remove the old one
                    planner.removeBlockDefinition(props.info.item.asset);
                }

                planner.addBlockDefinition(block); // Will replace the ref if it already exists
                planner.updateBlockInstance(
                    props.info.item.instance.id,
                    (instance) => {
                        const blockTitle =
                            block.data.metadata.title ??
                            parseKapetaUri(block.data.metadata.name).name;
                        const result = {
                            ...instance,
                            name: instance.name || blockTitle,
                            block: {
                                ...instance.block,
                                ref: block.ref,
                            },
                        };
                        return result;
                    }
                );
            }}
            files={
                (blocks &&
                    blocks.map((item) => {
                        return item.ref;
                    })) ||
                []
            }
        />
    );
};
