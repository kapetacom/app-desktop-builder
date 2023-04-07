import React, { useEffect, useState } from 'react';

import { toClass } from '@kapeta/ui-web-utils';
import { InstanceEventType, InstanceService } from '@kapeta/ui-web-context';
import { showToasty, ToastType } from '@kapeta/ui-web-components';
import './PlanEditorTopMenu.less';

interface Props {
    readonly: boolean
    version: string;
    systemId: string;
}

export const PlanEditorTopMenu = (props: Props) => {
    const [playing, setPlaying] = useState(false);
    const [processing, setProcessing] = useState(false);

    const doProcess = async (handler, errorMsg) => {
        setProcessing(true);
        try {
            const result = await handler();
            if (result && result.error) {
                throw new Error(result.error);
            }
        } catch (e) {
            showToasty({
                title: errorMsg,
                message: e.message,
                type: ToastType.DANGER,
            });
        } finally {
            setProcessing(false);
        }
    };

    const containerClass = toClass({
        'top-menu': true,
        'read-only': props.readonly,
        playing,
    });

    useEffect(() => {
        const updateState = async () => {
            const status = await InstanceService.getInstanceStatusForPlan(
                props.systemId
            );
            setPlaying(status.filter((s) => s.status !== 'stopped').length > 0);
        };
        updateState().catch(() => {
            // ignore initial error
        });
        return InstanceService.subscribe(
            props.systemId,
            InstanceEventType.EVENT_INSTANCE_CHANGED,
            updateState
        );
    }, [props.systemId]);

    return (
        <div className={containerClass}>
            <div className="buttons">
                <button
                    type="button"
                    disabled={playing || processing}
                    onClick={async () => {
                        await doProcess(async () => {
                            await InstanceService.startInstances(
                                props.systemId
                            );
                            setPlaying(true);
                        }, 'Failed to start plan');
                    }}
                >
                    <i className="fa fa-play" />
                    <span>Start</span>
                </button>
                <button
                    type="button"
                    disabled={!playing || processing}
                    onClick={async () => {
                        await doProcess(async () => {
                            await InstanceService.stopInstances(props.systemId);
                            setPlaying(false);
                        }, 'Failed to stop plan');
                    }}
                >
                    <i className="fa fa-stop" />
                    <span>Stop</span>
                </button>
            </div>
        </div>
    );
};
