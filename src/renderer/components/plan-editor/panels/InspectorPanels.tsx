import { ItemType } from '@kapeta/ui-web-types';
import { Connection } from '@kapeta/schemas';
import React from 'react';
import { EditorBlockInspectorPanel } from './block-inspector/EditorBlockInspectorPanel';
import { BlockInfo, InspectItemInfo } from '../types';
import { ConnectionInspectorPanel } from './connection-inspector/ConnectionInspectorPanel';

interface Props {
    systemId: string;
    info: InspectItemInfo | null;
    onClosed: () => void;
}

export const InspectorPanels = (props: Props) => {
    const inspectInfo = props.info;

    return (
        <>
            <EditorBlockInspectorPanel
                systemId={props.systemId}
                instance={
                    inspectInfo?.type === ItemType.BLOCK
                        ? inspectInfo?.item.instance
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
