import React, {useContext, useEffect, useMemo} from 'react';
import { Modal, ModalSize } from '@kapeta/ui-web-components';
import { TrafficService, TrafficEventType, ResourceTypeProvider } from '@kapeta/ui-web-context';
import {BlockConnectionSpec, ConnectionMethodsMapping, ResourceRole, Traffic} from '@kapeta/ui-web-types';
import {useList} from "react-use";
import { getConnectionId, PlannerContext, PlannerContextData } from '@kapeta/ui-web-plan-editor';

interface ModalProps {
    connection: BlockConnectionSpec;
    planner: PlannerContextData;
    trafficLines: Traffic[]
}

const ModalContent = ({planner, connection, trafficLines}:ModalProps) => {
    if (!connection) {
        return null;
    }

    let providerResource = planner.getResourceByBlockIdAndName(
        connection.from.blockId,
        connection.from.resourceName,
        ResourceRole.PROVIDES
    );

    let consumerResource = planner.getResourceByBlockIdAndName(
        connection.to.blockId,
        connection.to.resourceName,
        ResourceRole.CONSUMES
    );

    if (!providerResource || !consumerResource) {
        return <div>Invalid connection received</div>;
    }

    const converter = ResourceTypeProvider.getConverterFor(
        providerResource.kind,
        consumerResource.kind
    );

    if (!converter || !converter.inspectComponentType) {
        return <div>No traffic inspector defined for connection type</div>;
    }

    const Inspector = converter.inspectComponentType;

    const mapping: ConnectionMethodsMapping = connection.mapping || {};

    return <Inspector trafficLines={trafficLines} mapping={mapping} />;
}

interface Props {
    connection?: BlockConnectionSpec|null;
    open: boolean;
    onClosed: () => void;
}


export const ConnectionInspectorPanel = (props:Props) => {
    const planner = useContext(PlannerContext);

    const [trafficLines, trafficLinesHandler] = useList<Traffic>([]);

    const connectionId = useMemo(() => props.connection ? getConnectionId(props.connection) : null, [props.connection]);

    const onTrafficStart = (payload: Traffic) => {
        trafficLinesHandler.push(payload);
    };

    const onTrafficEnd = (payload: Traffic) => {
        const ix = trafficLines.findIndex(t => t.id === payload.id);
        if (ix > -1) {
            const newItem = {...trafficLines[ix], ...payload};
            trafficLinesHandler.updateAt(ix, newItem);
        }
    };

    useEffect(() => {
        if (!connectionId) {
            return () => {};
        }

        const unsubscribes = [
            TrafficService.subscribe(connectionId, TrafficEventType.TRAFFIC_START, onTrafficStart),
            TrafficService.subscribe(connectionId, TrafficEventType.TRAFFIC_END, onTrafficEnd),
        ];

        return () => {
            unsubscribes.forEach(u => u());
        }

    }, [connectionId])

    return (
        <Modal
            open={props.open}
            title="Connection Traffic Inspector"
            onClose={props.onClosed}
            size={ModalSize.large} >
            {props.connection &&
                <ModalContent planner={planner}
                              connection={props.connection}
                              trafficLines={trafficLines} />
            }
        </Modal>
    );
}
