import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { InstanceEventType, InstanceService, TaskService, TaskStatus } from '@kapeta/ui-web-context';
import {
    ButtonType,
    ConfigurationEditor,
    DSL_LANGUAGE_ID,
    DSLConverters,
    DSLEntity,
    EntityEditor,
    FormButtons,
    FormContainer,
    showToasty,
    ToastType,
    useFormContextField,
} from '@kapeta/ui-web-components';
import './PlanEditorTopMenu.less';
import { PlannerContext } from '@kapeta/ui-web-plan-editor';
import { useAsync, useAsyncFn } from 'react-use';
import { PlanForm } from '../forms/PlanForm';
import { getPlanConfig, setPlanConfig } from '../../api/LocalConfigService';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Stack,
    Tab,
    Tabs,
    ThemeProvider,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { TabList } from 'react-tabs';
import { kapetaLight } from '../../Theme';

const ConfigSchemaEditor = () => {
    const configurationField = useFormContextField('spec.configuration');
    const configuration = configurationField.get();
    const result = {
        code: configuration?.source?.value || '',
        entities: configuration?.types?.map ? configuration?.types?.map(DSLConverters.fromSchemaEntity) : [],
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
                newResult.entities && setConfiguration(newResult.code, newResult.entities);
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
    const [settingsTab, setSettingsTab] = useState('general');

    const startPlanJobId = `plan:start:${props.systemId}`;
    const stopPlanJobId = `plan:stop:${props.systemId}`;

    const processTask = useCallback(
        (task) => {
            const active = [TaskStatus.RUNNING, TaskStatus.PENDING].includes(task.status);
            if (task.id === startPlanJobId) {
                if (processing !== active) {
                    setProcessing(active);
                }
                if (starting !== active) {
                    setStarting(active);
                }
            }
            if (task.id === stopPlanJobId) {
                if (processing !== active) {
                    setProcessing(active);
                }
                if (stopping !== active) {
                    setStopping(active);
                }
            }
        },
        [startPlanJobId, stopPlanJobId, processing, stopping, starting]
    );

    useEffect(() => {
        return TaskService.subscribe(processTask, () => {
            setProcessing(false);
            setStopping(false);
            setStarting(false);
        });
    }, [startPlanJobId, stopPlanJobId, processTask]);

    useAsync(async () => {
        const tasks = await TaskService.list();
        tasks.forEach(processTask);
    }, [startPlanJobId, stopPlanJobId, processTask]);

    const doProcess = async (handler: () => Promise<void | { error: string }>, message: string, errorMsg: string) => {
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
        }
    };

    useEffect(() => {
        const updateState = async () => {
            const status = await InstanceService.getInstanceStatusForPlan(props.systemId);
            setAllPlaying(status.length > 0 && status.filter((s) => s.status === 'stopped').length === 0);
            setAnyPlaying(status.length > 0 && status.filter((s) => s.status !== 'stopped').length > 0);
        };
        updateState().catch(() => {
            // ignore initial error
        });

        return InstanceService.subscribe(props.systemId, InstanceEventType.EVENT_INSTANCE_CHANGED, updateState);
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

    const hasConfig = !!(
        planner.plan?.spec?.configuration?.types && planner.plan?.spec?.configuration?.types.length > 0
    );

    return (
        <Paper
            className={'planner-top-menu'}
            elevation={0}
            sx={{
                padding: '7px 10px',
                position: 'absolute',
                borderRadius: 0,
                top: 0,
                left: props.readonly ? 0 : 284,
                borderLeft: `1px solid ${grey[200]}`,
                right: 0,
                height: 52,
                lineHeight: 52,
                zIndex: 6,
                boxSizing: 'border-box',
            }}
        >
            <Stack spacing={2} direction="row">
                <Button
                    disabled={allPlaying || processing}
                    variant={'contained'}
                    color={'primary'}
                    startIcon={<i className="fa fa-play" />}
                    onClick={async () => {
                        await doProcess(
                            async () => {
                                setStarting(true);
                                try {
                                    await InstanceService.startInstances(props.systemId);
                                    setAllPlaying(true);
                                } finally {
                                    setStarting(false);
                                }
                            },
                            `Starting plan: ${props.systemId}`,
                            'Failed to start plan'
                        );
                    }}
                >
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
                        await doProcess(
                            async () => {
                                setStopping(true);
                                try {
                                    await InstanceService.stopInstances(props.systemId);
                                    setAllPlaying(false);
                                } finally {
                                    setStopping(false);
                                }
                            },
                            `Stopping plan: ${props.systemId}`,
                            'Failed to stop plan'
                        );
                    }}
                >
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
                    }}
                >
                    Settings
                </Button>
            </Stack>
            <ThemeProvider theme={kapetaLight}>
                <Dialog open={showSettings} className="modal-plan-settings" onClose={() => setShowSettings(false)}>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogContent
                        sx={{
                            height: '420px',
                        }}
                    >
                        <FormContainer
                            initialValue={formData}
                            onSubmitData={async (data) => {
                                planner.updatePlanMetadata(data.metadata, data.spec.configuration);
                                await setPlanConfig(props.systemId, data.configuration);
                                setShowSettings(false);
                            }}
                        >
                            <Stack direction={'column'}>
                                <Box
                                    sx={{
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Tabs
                                        orientation={'horizontal'}
                                        variant={'fullWidth'}
                                        value={settingsTab}
                                        onChange={(evt, tabId) => setSettingsTab(tabId)}
                                    >
                                        <Tab value="general" label="General" />
                                        {hasConfig && <Tab value="configuration" label="Configuration" />}
                                        {!props.readonly && <Tab value="config-schema" label="Configuration Schema" />}
                                    </Tabs>
                                </Box>
                                <Box flex={1} minHeight={'300px'} minWidth={'500px'}>
                                    {settingsTab === 'general' && <PlanForm />}
                                    {settingsTab === 'configuration' && (
                                        <div className="configuration-editor">
                                            <p className="info">Define configuration locally for this plan</p>
                                            <ConfigValueEditor systemId={props.systemId} />
                                        </div>
                                    )}
                                    {settingsTab === 'config-schema' && (
                                        <div className="configuration-schema-editor">
                                            <p className="info">Define configuration data types for this plan</p>
                                            <ConfigSchemaEditor />
                                        </div>
                                    )}
                                </Box>
                            </Stack>
                            <FormButtons>
                                <Button
                                    variant={'outlined'}
                                    color={'error'}
                                    onClick={() => {
                                        setShowSettings(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button variant={'contained'} color={'primary'} type={'submit'}>
                                    Save
                                </Button>
                            </FormButtons>
                        </FormContainer>
                    </DialogContent>
                </Dialog>
            </ThemeProvider>
        </Paper>
    );
};
