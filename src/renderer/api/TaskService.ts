import { simpleFetch, Task, TaskStore } from '@kapeta/ui-web-context';
import { SocketService } from './SocketService';
import { clusterPath } from './ClusterConfig';

export const EVENT_TASK_UPDATED = 'task-updated';
export const EVENT_TASK_ADDED = 'task-added';
export const EVENT_TASK_REMOVED = 'task-removed';

class TaskServiceImpl implements TaskStore {
    get(id: string): Promise<Task> {
        return simpleFetch(clusterPath(`/tasks/${encodeURIComponent(id)}`));
    }

    list(): Promise<Task[]> {
        return simpleFetch(clusterPath(`/tasks/`));
    }

    subscribe(listener: (event: Task) => void, disconnectHandler?: () => void) {
        SocketService.on(EVENT_TASK_ADDED, listener);

        SocketService.on(EVENT_TASK_UPDATED, listener);

        if (disconnectHandler) {
            SocketService.on('disconnect', disconnectHandler);
        }

        return () => {
            SocketService.off(EVENT_TASK_ADDED, listener);
            SocketService.off(EVENT_TASK_UPDATED, listener);
            if (disconnectHandler) {
                SocketService.off('disconnect', disconnectHandler);
            }
        };
    }
}

export const TaskService = new TaskServiceImpl();
