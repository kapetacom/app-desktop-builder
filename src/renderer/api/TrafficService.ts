import { Traffic } from '@kapeta/ui-web-types';
import { SocketService } from './SocketService';

export enum TrafficEventType {
    TRAFFIC_START = 'traffic_start',
    TRAFFIC_END = 'traffic_end',
}

export type ConnectionListener = (traffic: Traffic) => void;

class TrafficServiceImpl {
    subscribe(connectionId: string, eventType: TrafficEventType, handler: ConnectionListener) {
        SocketService.joinRoom(connectionId);
        SocketService.on(eventType, handler);

        return () => {
            this.unsubscribe(connectionId, eventType, handler);
        };
    }

    unsubscribe(connectionId: string, eventType: TrafficEventType, handler: ConnectionListener) {
        SocketService.leaveRoom(connectionId);
        SocketService.off(eventType, handler);
    }
}

export const TrafficService = new TrafficServiceImpl();
