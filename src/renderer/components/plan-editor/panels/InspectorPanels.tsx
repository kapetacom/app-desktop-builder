import { Connection } from '@kapeta/schemas';
import React from 'react';
import { EditorBlockInspectorPanel } from './block-inspector/EditorBlockInspectorPanel';
import { DataEntityType, InspectItemInfo } from '../types';
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
                instance={inspectInfo?.type === DataEntityType.INSTANCE ? inspectInfo?.item.instance : null}
                open={inspectInfo?.type === DataEntityType.INSTANCE}
                onClosed={props.onClosed}
            />

            <ConnectionInspectorPanel
                open={inspectInfo?.type === DataEntityType.CONNECTION}
                onClosed={props.onClosed}
                connection={inspectInfo?.type === DataEntityType.CONNECTION ? (inspectInfo?.item as Connection) : null}
            />
        </>
    );
};
