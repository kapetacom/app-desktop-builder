/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { useDesktop, TaskGetter, TaskState } from '@kapeta/ui-web-components';
import { Task, TaskStatus } from '@kapeta/ui-web-context';
import { useEffect, useState } from 'react';
import { useAsync } from 'react-use';
import { TaskService } from '../api/TaskService';

/**
 * Hook to get a background task on desktop
 */
export const taskGetter: TaskGetter = (taskId: string, cb?: (task: Task) => void | Promise<void>): TaskState => {
    const desktop = useDesktop();
    if (!desktop) {
        return {
            ready: true,
            active: false,
            task: null,
        };
    }

    async function handleCallback(task: Task) {
        if (cb) {
            await cb(task);
        }
    }

    const [task, setTask] = useState<Task>();
    const [processing, setProcessing] = useState(false);

    const loader = useAsync(async () => {
        const t = await TaskService.get(taskId);
        if (t) {
            setTask(t);
            await handleCallback(t);
        }
    }, [taskId]);

    useEffect(() => {
        return TaskService.subscribe(
            async (task) => {
                if (task.id === taskId) {
                    setTask(task);
                    setProcessing(true);
                    try {
                        await handleCallback(task);
                    } finally {
                        setProcessing(false);
                    }
                }
            },
            () => setTask(undefined)
        );
    }, [taskId]);

    return {
        task: task ?? null,
        active: !!(task && [TaskStatus.RUNNING, TaskStatus.PENDING].includes(task.status)),
        ready: !loader.loading && !processing,
    };
};
