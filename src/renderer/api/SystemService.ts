import { SocketService } from './SocketService';
import { clusterPath } from './ClusterConfig';
import { BlockStatusListener, InstanceEventType, PlanStatusListener, simpleFetch } from '@kapeta/ui-web-context';
import { InstanceInfo } from '../components/plan-editor/types';
import { normalizeKapetaUri } from '../utils/planContextLoader';

class SystemServiceImpl {
    public subscribe(
        systemId: string,
        eventType: InstanceEventType,
        handler: PlanStatusListener | BlockStatusListener
    ) {
        systemId = normalizeKapetaUri(systemId);
        const contextId = `system-events/${encodeURIComponent(systemId)}`;
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

    async getInstanceCurrentStatus() {
        return simpleFetch(clusterPath(`/instances`), { method: 'GET' });
    }

    async getInstanceStatusForPlan(systemId): Promise<InstanceInfo[]> {
        return simpleFetch(clusterPath(`/instances/${encodeURIComponent(systemId)}/instances`), { method: 'GET' });
    }

    async startInstances(systemId: string) {
        return simpleFetch(clusterPath(`/instances/${encodeURIComponent(systemId)}/start`), { method: 'POST' });
    }

    async stopInstances(systemId: string) {
        return simpleFetch(clusterPath(`/instances/${encodeURIComponent(systemId)}/stop`), { method: 'POST' });
    }
}

export const SystemService = new SystemServiceImpl();
