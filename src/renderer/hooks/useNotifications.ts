/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { useEffect, useMemo } from 'react';
import { KapetaNotification } from '../components/shell/types';
import { EventEmitter } from 'events';
import { useInterval, useList } from 'react-use';
import { ListActions } from 'react-use/lib/useList';
import { useAutoUpdater } from '../auto-updater/hooks';

const NOTIFICATION_TTL = 60000;
const globalEmitter = new EventEmitter();

export const useNotifications = (): [KapetaNotification[], ListActions<KapetaNotification>] => {
    const [notifications, notificationsHandler] = useList<KapetaNotification>([]);

    useInterval(() => {
        let anyRemoved = false;
        const newNotifications = notifications.filter((notification) => {
            if (notification.type === 'progress' && notification.progress !== 100) {
                // Don't remove active progress notifications
                return true;
            }

            if (Date.now() - notification.timestamp > NOTIFICATION_TTL) {
                anyRemoved = true;
                return false;
            }

            return true;
        });

        if (anyRemoved) {
            notificationsHandler.set(newNotifications);
        }
    }, NOTIFICATION_TTL);

    useNotificationListener((notification) => {
        notificationsHandler.upsert((a, b) => a.id === b.id, notification);
    });

    useAutoUpdater();

    return [notifications, notificationsHandler];
};

export const useNotificationEmitter = () => {
    return useMemo(() => {
        return (notification: KapetaNotification) => {
            globalEmitter.emit('notification', notification);
        };
    }, []);
};

export const useNotificationListener = (listener: (notification: KapetaNotification) => void) => {
    useEffect(() => {
        globalEmitter.on('notification', listener);
        return () => {
            globalEmitter.off('notification', listener);
        };
    }, [listener]);
};
