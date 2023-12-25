/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useEffect } from 'react';
import { InstanceEventType, InstanceStatus } from '@kapeta/ui-web-context';

import { BlockInspectorPanel, LogEntry, LogLevel, LogSource, PlannerContext } from '@kapeta/ui-web-plan-editor';
import { useAsync, useList } from 'react-use';

import { BlockInstance } from '@kapeta/schemas';
import { getInstanceConfig } from '../../../../api/LocalConfigService';
import { InstanceService } from 'renderer/api/InstanceService';
import { InstanceInfo } from '../../types';

interface Props {
    systemId: string;
    instance?: BlockInstance;
    instanceInfo?: InstanceInfo;
    open: boolean;
    onClosed: () => void;
}

export const EditorBlockInspectorPanel = (props: Props) => {
    const { instance } = props;
    const [logs, logActions] = useList<LogEntry>([]);

    useEffect(() => {
        if (!props.instance?.id || !props.open) {
            return () => {
                // noop
            };
        }

        const onInstanceLog = (entry: any) => {
            logActions.push(entry);
        };

        return InstanceService.subscribeForLogs(
            props.systemId,
            props.instance?.id,
            InstanceEventType.EVENT_INSTANCE_LOG,
            onInstanceLog
        );
    }, [props.systemId, props.instance?.id, logActions, props.open]);

    const instanceConfig = useAsync(async () => {
        if (!props.instance?.id || !props.open) {
            return undefined;
        }
        return getInstanceConfig(props.systemId, props.instance!.id);
    }, [props.systemId, props.instance?.id, props.open]);

    const initialLogs = useAsync(async (): Promise<LogEntry[]> => {
        if (!instance?.id || !props.open) {
            return [];
        }
        const result = await InstanceService.getInstanceLogs(props.systemId, instance?.id);
        if (!result || !result.logs || result.logs.length === 0) {
            let message = 'Instance not detected as running yet.';
            if (props.instanceInfo) {
                if (props.instanceInfo.type === 'local') {
                    message = 'Instance is running outside of Kapeta. Inspect your terminal to view logs';
                } else if (props.instanceInfo.status === InstanceStatus.STOPPED) {
                    message = 'Instance is not running. Logs will become available when you start the instance.';
                } else {
                    message = 'Logs not available yet. Docker might take a while before it logs show up...';
                }
            }
            return [
                {
                    time: new Date().getTime(),
                    message,
                    level: LogLevel.INFO,
                    source: LogSource.STDOUT,
                },
            ];
        }
        return result?.ok === false ? [] : result.logs;
    }, [instance?.id, props.open, props.instanceInfo]);

    useEffect(() => {
        if (initialLogs.loading || !initialLogs.value || !props.open) {
            return;
        }
        logActions.clear();
        logActions.push(...initialLogs.value);
    }, [initialLogs.loading, initialLogs.value, props.open]);

    return instance ? (
        <BlockInspectorPanel
            open={props.open}
            onClosed={props.onClosed}
            logs={logs}
            instance={instance}
            configuration={instanceConfig.value}
        />
    ) : null;
};
