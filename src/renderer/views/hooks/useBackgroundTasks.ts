/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { useEffect } from 'react';
import { Task, TaskStatus } from '@kapeta/ui-web-context';
import { ListActions } from 'react-use/lib/useList';
import { KapetaNotification } from '../../components/shell/types';
import { useAsync } from 'react-use';
import { TaskService } from '../../api/TaskService';

function createNotification(task: Task): KapetaNotification {
    if (task.status === TaskStatus.FAILED) {
        return {
            id: task.id,
            type: 'error',
            message: task.metadata.name,
            read: false,
            timestamp: Date.now(),
        };
    }

    let progress = task.metadata.progress ?? -1;
    if (task.status === TaskStatus.COMPLETED) {
        progress = 100;
    }

    return {
        id: task.id,
        type: 'progress',
        message: task.metadata.name,
        read: false,
        progress,
        timestamp: Date.now(),
    };
}

export const useBackgroundTasks = (notificationsHandler: ListActions<KapetaNotification>) => {
    const tasks = useAsync(async () => {
        return TaskService.list();
    }, []);

    useEffect(() => {
        if (!tasks.value) {
            return;
        }

        tasks.value.forEach((task) => {
            notificationsHandler.upsert((a, b) => {
                return a.id === b.id;
            }, createNotification(task));
        });
    }, [tasks.value]);

    useEffect(() => {
        const taskUpdated = (task: Task) => {
            const notification = createNotification(task);

            notificationsHandler.upsert((a, b) => {
                return a.id === b.id;
            }, notification);
        };

        const disconnectHandler = () => {
            // Clear all notifications if we disconnect from the server
            notificationsHandler.clear();
        };

        return TaskService.subscribe(taskUpdated, disconnectHandler);
    }, [notificationsHandler]);
};
