import React, { useContext, useEffect, useMemo, useState } from 'react';

import { toClass } from '@kapeta/ui-web-utils';
import { InstanceEventType, InstanceService } from '@kapeta/ui-web-context';
import {
    FormContainer,
    Modal,
    ModalSize,
    showToasty,
    TabContainer,
    TabPage,
    ToastType,
    ConfigurationEditor,
    EntityEditor,
    FormButtons,
    ButtonType,
    ButtonStyle,
    useFormContextField,
    DSLConverters,
    DSL_LANGUAGE_ID,
    DSLEntity,
} from '@kapeta/ui-web-components';
import './PlanEditorTopMenu.less';
import { PlannerContext } from '@kapeta/ui-web-plan-editor';
import { useAsyncFn } from 'react-use';
import { PlanForm } from '../forms/PlanForm';
import { getPlanConfig, setPlanConfig } from '../../api/LocalConfigService';
import {useNotificationEmitter} from "../../hooks/useNotifications";
import {Button, ButtonGroup, CircularProgress, Stack} from "@mui/material";

const ConfigSchemaEditor = () => {
    const configurationField = useFormContextField('spec.configuration');
    const configuration = configurationField.get();
    const result = {
        code: configuration?.source?.value || '',
        entities: configuration?.types?.map
            ? configuration?.types?.map(DSLConverters.fromSchemaEntity)
            : [],
    };

    const setConfiguration = (code: string, results: DSLEntity[]) => {
        const types = results.map(DSLConverters.toSchemaEntity);
        const config = {
            types,
            source: {
                type: DSL_LANGUAGE_ID,
                value: code,
            },
        };
        configurationField.set(config);
    };

    return (
        <ConfigurationEditor
            value={result}
            onChange={(newResult) => {
                newResult.entities &&
                    setConfiguration(newResult.code, newResult.entities);
            }}
        />
    );
};

interface ConfigValueProps {
    systemId: string;
}

const ConfigValueEditor = (props: ConfigValueProps) => {
    const configurationSchemaField = useFormContextField('spec.configuration');
    const configurationField = useFormContextField('configuration');

    const configurationSchema = configurationSchemaField.get();

    return (
        <EntityEditor
            entities={configurationSchema.types ?? []}
            value={configurationField.get({})}
            onChange={async (value) => {
                configurationField.set(value);
            }}
        />
    );
};

interface Props {
    readonly: boolean;
    version: string;
    systemId: string;
}

export const PlanEditorTopMenu = (props: Props) => {
    const planner = useContext(PlannerContext);
    const [allPlaying, setAllPlaying] = useState(false);
    const [anyPlaying, setAnyPlaying] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [starting, setStarting] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const emitNotification = useNotificationEmitter();
    const notificationId = 'plan-run:' + props.systemId;

    const doProcess = async (handler:() => Promise<void|{error:string}>, message: string, errorMsg: string) => {
        setProcessing(true);
        try {
            emitNotification({
                type: 'progress',
                timestamp: Date.now(),
                progress: -1,
                read: false,
                id: notificationId,
                message
            });
            const result = await handler();
            if (result && result.error) {
                throw new Error(result.error);
            }
            emitNotification({
                type: 'progress',
                timestamp: Date.now(),
                progress: 100,
                read: false,
                id: notificationId,
                message
            });
        } catch (e) {
            showToasty({
                title: errorMsg,
                message: e.message,
                type: ToastType.DANGER,
            });
            emitNotification({
                type: 'error',
                timestamp: Date.now(),
                read: false,
                id: notificationId,
                message: errorMsg
            });
        } finally {
            setProcessing(false);
        }
    };

    const containerClass = toClass({
        'top-menu': true,
        'read-only': props.readonly,
        playing: anyPlaying,
    });

    useEffect(() => {
        const updateState = async () => {
            const status = await InstanceService.getInstanceStatusForPlan(
                props.systemId
            );
            setAllPlaying(
                status.length > 0 &&
                    status.filter((s) => s.status === 'stopped').length === 0
            );
            setAnyPlaying(
                status.length > 0 &&
                    status.filter((s) => s.status !== 'stopped').length > 0
            );
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

    const [planConfig, reloadConfig] = useAsyncFn(async () => {
        if (!showSettings) {
            return {};
        }
        return getPlanConfig(props.systemId);
    }, [props.systemId, showSettings]);

    const formData = useMemo(() => {
        return {
            ...planner.plan,
            configuration: planConfig.value,
        };
    }, [planConfig.value, planner.plan]);

    useEffect(() => {
        if (showSettings) {
            reloadConfig();
        }
    }, [props.systemId, planner.plan, showSettings, reloadConfig]);

    return (
        <div className={containerClass}>
            <Stack spacing={2} direction="row">
                <Button
                    disabled={allPlaying || processing}
                    variant={'contained'}
                    color={'primary'}
                    startIcon={<i className="fa fa-play" />}
                    onClick={async () => {
                        await doProcess(async () => {
                            setStarting(true);
                            try {
                                await InstanceService.startInstances(
                                    props.systemId
                                );
                                setAllPlaying(true);
                            } finally {
                                setStarting(false);
                            }
                        },
                            `Starting plan: ${props.systemId}`,
                            'Failed to start plan');
                    }} >
                    Start
                    {starting && (
                        <CircularProgress
                            size={24}
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                marginTop: '-12px',
                                marginLeft: '-12px',
                            }}
                        />
                    )}
                </Button>
                <Button
                    disabled={!anyPlaying || processing}
                    variant="outlined"
                    color={'warning'}
                    startIcon={<i className="fa fa-stop" />}
                    onClick={async () => {
                        await doProcess(async () => {
                            setStopping(true);
                            try {
                                await InstanceService.stopInstances(props.systemId);
                                setAllPlaying(false);
                            } finally {
                                setStopping(false);
                            }
                        },
                            `Stopping plan: ${props.systemId}`,
                            'Failed to stop plan');
                    }} >
                    Stop
                    {stopping && (
                        <CircularProgress
                            size={24}
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                marginTop: '-12px',
                                marginLeft: '-12px',
                            }}
                        />
                    )}
                </Button>

                <Button
                    startIcon={<i className="fa fa-gear" />}
                    variant="outlined"
                    color={'secondary'}
                    onClick={() => {
                        setShowSettings(true);
                    }} >
                    Settings
                </Button>

            </Stack>
            <Modal
                title="Settings"
                size={ModalSize.large}
                open={showSettings}
                className="modal-plan-settings"
                onClose={() => setShowSettings(false)}
            >
                <FormContainer
                    initialValue={formData}
                    onSubmitData={async (data) => {
                        planner.updatePlanMetadata(
                            data.metadata,
                            data.spec.configuration
                        );
                        await setPlanConfig(props.systemId, data.configuration);
                        setShowSettings(false);
                    }}
                >
                    <TabContainer defaultTab="general">
                        <TabPage id="general" title="General">
                            <PlanForm />
                        </TabPage>
                        {planner.plan?.spec?.configuration?.types &&
                            planner.plan?.spec?.configuration?.types?.length >
                                0 && (
                                <TabPage
                                    id="configuration"
                                    title="Configuration"
                                >
                                    <div className="configuration-editor">
                                        <p className="info">
                                            Define configuration locally for
                                            this plan
                                        </p>
                                        <ConfigValueEditor
                                            systemId={props.systemId}
                                        />
                                    </div>
                                </TabPage>
                            )}
                        {!props.readonly && (
                            <TabPage
                                id="config-schema"
                                title="Configuration Schema"
                            >
                                <div className="configuration-schema-editor">
                                    <p className="info">
                                        Define configuration data types for this
                                        plan
                                    </p>
                                    <ConfigSchemaEditor />
                                </div>
                            </TabPage>
                        )}
                    </TabContainer>
                    <FormButtons>
                        <Button
                            type={ButtonType.BUTTON}

                            onClick={() => {
                                setShowSettings(false);
                            }}

                        >Cancel</Button>
                        <Button
                            type={ButtonType.SUBMIT}
                        >Save</Button>
                    </FormButtons>
                </FormContainer>
            </Modal>
        </div>
    );
};
