import React, { useEffect, useMemo } from 'react';
import { InstanceEventType, InstanceService } from '@kapeta/ui-web-context';

import { BlockInspectorPanel } from '@kapeta/ui-web-plan-editor';
import { useAsync } from 'react-use';

import { BlockInstance } from '@kapeta/schemas';
import { getInstanceConfig } from '../../../../api/LocalConfigService';

interface Props {
    systemId: string;
    instance?: BlockInstance;
    open: boolean;
    onClosed: () => void;
}

export const EditorBlockInspectorPanel = (props: Props) => {
    const { instance } = props;
    const blockRef = instance?.block.ref;

    const emitter = useMemo(() => {
        const listeners: ((entry: any) => void)[] = [];
        return {
            listeners,
            onLog: (listener: (entry: any) => void) => {
                listeners.push(listener);
            },
        };
    }, [blockRef]);

    useEffect(() => {
        if (!blockRef) {
            return;
        }

        const onInstanceLog = (entry: any) => {
            emitter.listeners.forEach((listener) => {
                listener(entry);
            });
        };

        InstanceService.subscribe(
            blockRef,
            InstanceEventType.EVENT_INSTANCE_LOG,
            onInstanceLog
        );

        return () => {
            InstanceService.unsubscribe(
                blockRef,
                InstanceEventType.EVENT_INSTANCE_LOG,
                onInstanceLog
            );
        };
    }, [blockRef, emitter]);

    const instanceConfig = useAsync(async () => {
        if (!props.instance?.id || !props.open) {
            return undefined;
        }
        return getInstanceConfig(props.systemId, props.instance!.id);
    }, [props.systemId, props.instance?.id, props.open]);

    const logs = useAsync(async () => {
        if (!instance?.id || !props.open) {
            return [];
        }
        const result = await InstanceService.getInstanceLogs(
            props.systemId,
            instance?.id
        );
        return result.ok === false ? [] : result.logs;
    }, [instance?.id, props.open]);

    return instance ? (
        <BlockInspectorPanel
            open={props.open}
            onClosed={props.onClosed}
            logs={logs.value}
            emitter={emitter}
            instance={instance}
            configuration={instanceConfig.value}
        />
    ) : null;
};
