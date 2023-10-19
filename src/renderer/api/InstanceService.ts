import { SocketService } from './SocketService';
import { clusterPath } from './ClusterConfig';
import {
    BlockStatusListener,
    InstanceEventType,
    InstanceStatus,
    PlanStatusListener,
    simpleFetch,
} from '@kapeta/ui-web-context';

class InstanceServiceImpl {
    public subscribeForLogs(
        systemId: string,
        instanceId: string,
        eventType: InstanceEventType,
        handler: BlockStatusListener
    ) {
        const contextId = `instance-logs/${encodeURIComponent(systemId)}/${encodeURIComponent(instanceId)}`;
        const contextHandler = (evt: any) => {
            if (evt.context !== contextId) {
                return;
            }

            return handler(evt.payload);
        };

        SocketService.joinRoom(contextId);
        SocketService.on(eventType, contextHandler);
        return () => {
            SocketService.leaveRoom(contextId);
            SocketService.off(eventType, contextHandler);
        };
    }

    async getInstanceStatusForSystem(systemId: string) {
        return simpleFetch(clusterPath(`/instances/${encodeURIComponent(systemId)}/instances`), {
            method: 'GET',
        }) as Promise<
            Array<{
                address: string;
                systemId: string;
                instanceId: string;
                status: InstanceStatus;
                portType: string;
            }>
        >;
    }

    async getInstanceStatusForInstance(systemId, instanceId) {
        return simpleFetch(
            clusterPath(`/instances/${encodeURIComponent(systemId)}/instances/${encodeURIComponent(instanceId)}`),
            { method: 'GET' }
        );
    }

    async startInstance(systemId: string, instanceId: string) {
        return simpleFetch(
            clusterPath(`/instances/${encodeURIComponent(systemId)}/${encodeURIComponent(instanceId)}/start`),
            { method: 'POST' }
        );
    }

    async stopInstance(systemId: string, instanceId: string) {
        return simpleFetch(
            clusterPath(`/instances/${encodeURIComponent(systemId)}/${encodeURIComponent(instanceId)}/stop`),
            { method: 'POST' }
        );
    }

    async getInstanceLogs(systemId: string, instanceId: string) {
        return simpleFetch(
            clusterPath(`/instances/${encodeURIComponent(systemId)}/${encodeURIComponent(instanceId)}/logs`),
            { method: 'GET' }
        );
    }
}

export const InstanceService = new InstanceServiceImpl();
