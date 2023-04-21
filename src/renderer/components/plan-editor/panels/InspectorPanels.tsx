import { BlockInspectorPanel } from './block-inspector/BlockInspectorPanel';
import { ItemType } from '@kapeta/ui-web-types';
import { Connection } from '@kapeta/schemas';
import { BlockInfo, InspectItemInfo } from '../types';
import { ConnectionInspectorPanel } from './connection-inspector/ConnectionInspectorPanel';
import React from 'react';

interface Props {
    systemId: string;
    info: InspectItemInfo | null;
    onClosed: () => void;
}

export const InspectorPanels = (props: Props) => {
    const inspectInfo = props.info;

    return (
        <>
            <BlockInspectorPanel
                systemId={props.systemId}
                info={
                    inspectInfo?.type === ItemType.BLOCK
                        ? (inspectInfo?.item as BlockInfo)
                        : null
                }
                open={inspectInfo?.type === ItemType.BLOCK}
                onClosed={props.onClosed}
            />

            <ConnectionInspectorPanel
                open={inspectInfo?.type === ItemType.CONNECTION}
                onClosed={props.onClosed}
                connection={
                    inspectInfo?.type === ItemType.CONNECTION
                        ? (inspectInfo?.item as Connection)
                        : null
                }
            />
        </>
    );
};
