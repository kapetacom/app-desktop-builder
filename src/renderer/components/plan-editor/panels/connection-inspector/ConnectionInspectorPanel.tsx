/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext, useEffect, useMemo } from 'react';

import { ResourceTypeProvider } from '@kapeta/ui-web-context';
import { ConnectionMethodsMapping, ResourceRole, Traffic } from '@kapeta/ui-web-types';
import { Connection } from '@kapeta/schemas';
import { useList } from 'react-use';
import { getConnectionId, PlannerContext, PlannerContextData } from '@kapeta/ui-web-plan-editor';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { TrafficEventType, TrafficService } from '../../../../api/TrafficService';

interface ModalProps {
    connection: Connection;
    planner: PlannerContextData;
    trafficLines: Traffic[];
}

const ModalContent = ({ planner, connection, trafficLines }: ModalProps) => {
    if (!connection) {
        return null;
    }

    let providerResource = planner.getResourceByBlockIdAndName(
        connection.provider.blockId,
        connection.provider.resourceName,
        ResourceRole.PROVIDES
    );

    let consumerResource = planner.getResourceByBlockIdAndName(
        connection.consumer.blockId,
        connection.consumer.resourceName,
        ResourceRole.CONSUMES
    );

    if (!providerResource || !consumerResource) {
        return <div>Invalid connection received</div>;
    }

    const converter = ResourceTypeProvider.getConverterFor(providerResource.kind, consumerResource.kind);

    if (!converter || !converter.inspectComponentType) {
        return <div>No traffic inspector defined for connection type</div>;
    }

    const Inspector = converter.inspectComponentType;

    const mapping: ConnectionMethodsMapping = connection.mapping || {};

    // @ts-ignore React types are messy
    return <Inspector trafficLines={trafficLines} mapping={mapping} />;
};

interface Props {
    connection?: Connection | null;
    open: boolean;
    onClosed: () => void;
}

export const ConnectionInspectorPanel = (props: Props) => {
    const planner = useContext(PlannerContext);

    const [trafficLines, trafficLinesHandler] = useList<Traffic>([]);

    const connectionId = useMemo(
        () => (props.connection ? getConnectionId(props.connection) : null),
        [props.connection]
    );

    useEffect(() => {
        if (!connectionId) {
            return () => {
                // noop
            };
        }
        const onTrafficStart = (payload: Traffic) => {
            trafficLinesHandler.push(payload);
        };
        const onTrafficEnd = (payload: Traffic) => {
            const ix = trafficLines.findIndex((t) => t.id === payload.id);
            if (ix > -1) {
                const newItem = { ...trafficLines[ix], ...payload };
                trafficLinesHandler.updateAt(ix, newItem);
            }
        };

        const unsubscribes = [
            TrafficService.subscribe(connectionId, TrafficEventType.TRAFFIC_START, onTrafficStart),
            TrafficService.subscribe(connectionId, TrafficEventType.TRAFFIC_END, onTrafficEnd),
        ];

        return () => {
            unsubscribes.forEach((u) => u());
        };
    }, [connectionId, trafficLines, trafficLinesHandler]);

    return (
        <Dialog open={props.open} onClose={props.onClosed}>
            <DialogTitle>Connection Traffic Inspector</DialogTitle>
            <DialogContent>
                {props.connection && (
                    <ModalContent planner={planner} connection={props.connection} trafficLines={trafficLines} />
                )}
            </DialogContent>
        </Dialog>
    );
};
