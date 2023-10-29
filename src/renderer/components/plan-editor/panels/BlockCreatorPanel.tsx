/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext, useEffect, useState } from 'react';
import { BlockCreator, createNewBlock } from '../../creators/BlockCreator';
import { AssetCreatorState } from '../../creators/AssetCreator';
import { PlannerContext } from '@kapeta/ui-web-plan-editor';
import { BlockDefinition } from '@kapeta/schemas';
import { DataEntityType, EditItemInfo } from '../types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { useBlocks } from '../../../hooks/assetHooks';
import { AssetService } from 'renderer/api/AssetService';

interface Props {
    open: boolean;
    info?: EditItemInfo | null;
    onClosed: () => void;
}

export const BlockCreatorPanel = (props: Props) => {
    const planner = useContext(PlannerContext);
    const [creatorState, setCreatorState] = useState(AssetCreatorState.CLOSED);

    useEffect(() => {
        setCreatorState(props.open ? AssetCreatorState.CREATING : AssetCreatorState.CLOSED);
    }, [props.open]);

    const blocks = useBlocks();

    return (
        <BlockCreator
            assetService={AssetService}
            state={creatorState}
            onStateChanged={setCreatorState}
            createNewKind={(): BlockDefinition => {
                if (props.info?.type !== DataEntityType.BLOCK) {
                    return createNewBlock();
                }

                const out = props.info.item.asset.content ? { ...props.info?.item.asset.content } : createNewBlock();
                if (!out.metadata.visibility) {
                    out.metadata.visibility = 'private';
                }
                return out;
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
                planner.updateBlockInstance(props.info.item.instance.id, (instance) => {
                    const blockTitle = block.content.metadata.title ?? parseKapetaUri(block.content.metadata.name).name;

                    return {
                        ...instance,
                        name: instance.name || blockTitle,
                        block: {
                            ...instance.block,
                            ref: block.ref,
                        },
                    };
                });
            }}
            files={blocks.data.map((item) => {
                return item.ref;
            })}
        />
    );
};
