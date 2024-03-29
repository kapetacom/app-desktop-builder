/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Connection } from '@kapeta/schemas';
import React from 'react';
import { EditorBlockInspectorPanel } from './block-inspector/EditorBlockInspectorPanel';
import { DataEntityType, InspectItemInfo, InstanceInfo } from '../types';
import { ConnectionInspectorPanel } from './connection-inspector/ConnectionInspectorPanel';

interface Props {
    systemId: string;
    info: InspectItemInfo | null;
    instanceInfo?: InstanceInfo;
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
                instanceInfo={props.instanceInfo}
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
