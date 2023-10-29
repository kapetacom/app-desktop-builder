import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { InstanceEventType, TaskStatus } from '@kapeta/ui-web-context';
import {
    ConfigurationEditor,
    DSL_LANGUAGE_ID,
    DSLConverters,
    DSLEntity,
    EntityEditor,
    FormButtons,
    FormContainer,
    KapDialog,
    showToasty,
    ToastType,
    Tooltip,
    useFormContextField,
    InfoBox,
    useConfirm,
} from '@kapeta/ui-web-components';
import './PlanEditorTopMenu.less';
import {
    BlockDefinitionReference,
    createGlobalConfigurationFromEntities,
    PlannerContext,
    resolveConfigurationFromDefinition,
} from '@kapeta/ui-web-plan-editor';
import { useAsync, useAsyncFn } from 'react-use';
import { PlanForm } from '../forms/PlanForm';
import { getPlanConfig, setPlanConfig } from '../../api/LocalConfigService';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Modal,
    Paper,
    Popover,
    Stack,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { TaskService } from 'renderer/api/TaskService';
import { SystemService } from 'renderer/api/SystemService';
import PublishIcon from '@mui/icons-material/Publish';
import { CodeBlock } from '../general/CodeBlock';
import CoffeeIcon from '../../../../assets/images/coffee.svg';
import { TipBox } from '../general/TipBox';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import _ from 'lodash';

const ConfigSchemaEditor = (props: { systemId: string }) => {
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
            key={props.systemId}
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
            key={props.systemId}
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
    const confirm = useConfirm();
    const [allPlaying, setAllPlaying] = useState(false);
    const [anyPlaying, setAnyPlaying] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [starting, setStarting] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showPlanTakesTimeTip, setShowPlanTakesTimeTip] = useState(false);
    const [settingsTab, setSettingsTab] = useState('general');
    const [publishButton, setPublishButton] = useState<HTMLButtonElement | null>(null);

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
            const totalBlocks = planner.plan?.spec?.blocks?.length || 0;
            const status = await SystemService.getInstanceStatusForPlan(props.systemId);
            setAllPlaying(
                totalBlocks === status.length &&
                    status.length > 0 &&
                    status.filter((s) => s.status === 'stopped').length === 0
            );
            setAnyPlaying(status.length > 0 && status.filter((s) => s.status !== 'stopped').length > 0);
        };
        updateState().catch(() => {
            // ignore initial error
        });
        return SystemService.subscribe(props.systemId, InstanceEventType.EVENT_INSTANCE_CHANGED, updateState);
    }, [props.systemId]);

    const [planConfig, reloadConfig] = useAsyncFn(async () => {
        if (!showSettings) {
            return {};
        }
        const config = await getPlanConfig(props.systemId);
        return resolveConfigurationFromDefinition(
            planner.plan?.spec?.configuration?.types,
            config,
            planner.plan?.spec?.defaultConfiguration
        );
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

    useEffect(() => {
        if (!starting) {
            return () => {};
        }

        // Show tip after 30 seconds
        const timeout = setTimeout(() => {
            setShowPlanTakesTimeTip(true);
        }, 30000);

        return () => {
            clearTimeout(timeout);
        };
    }, [starting]);

    const hasConfig = !!(
        planner.plan?.spec?.configuration?.types && planner.plan?.spec?.configuration?.types.length > 0
    );

    return (
        <Paper
            data-kap-id={'plan-editor-top-menu'}
            className="planner-top-menu"
            elevation={0}
            sx={{
                padding: '7px 10px',
                position: 'absolute',
                borderRadius: 0,
                top: 0,
                left: 284,
                borderLeft: `1px solid ${grey[200]}`,
                right: 0,
                height: 52,
                lineHeight: 52,
                zIndex: 6,
                boxSizing: 'border-box',
            }}
        >
            <Stack direction="row" justifyContent={'space-between'} alignItems={'center'}>
                <Stack spacing={2} direction="row">
                    <Tooltip title={'Start all blocks'}>
                        <Button
                            data-kap-id={'plan-editor-top-menu-play'}
                            disabled={allPlaying || processing}
                            variant={'contained'}
                            color={'primary'}
                            startIcon={<i className="fa fa-play" />}
                            onClick={async () => {
                                await doProcess(
                                    async () => {
                                        setStarting(true);
                                        try {
                                            await SystemService.startInstances(props.systemId);
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
                    </Tooltip>
                    <Tooltip title={'Stop all blocks'}>
                        <Button
                            data-kap-id={'plan-editor-top-menu-stop'}
                            disabled={!anyPlaying || processing}
                            variant="outlined"
                            color={'warning'}
                            startIcon={<i className="fa fa-stop" />}
                            onClick={async () => {
                                await doProcess(
                                    async () => {
                                        setStopping(true);
                                        try {
                                            await SystemService.stopInstances(props.systemId);
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
                    </Tooltip>

                    <Button
                        data-kap-id={'plan-editor-top-menu-settings'}
                        startIcon={<i className="fa fa-gear" />}
                        variant="outlined"
                        color={'secondary'}
                        onClick={() => {
                            setShowSettings(true);
                        }}
                    >
                        Settings
                    </Button>

                    {!props.readonly && (
                        <Tooltip title={'Publish to Kapeta'}>
                            <Button
                                data-kap-id={'plan-editor-top-menu-publish'}
                                variant="outlined"
                                color={'secondary'}
                                startIcon={<PublishIcon />}
                                onClick={(evt) => {
                                    setPublishButton(evt.currentTarget);
                                }}
                            >
                                Publish
                            </Button>
                        </Tooltip>
                    )}
                </Stack>
                {props.readonly && (
                    <Tooltip
                        sx={{
                            alignSelf: 'flex-end',
                        }}
                        title={`You can not edit this plan because you've opened a versioned asset.
                    You can only edit "local" versions where the plan is located on your hard disk`}
                    >
                        <Chip
                            sx={{
                                cursor: 'help',
                            }}
                            label={`Read-only`}
                        />
                    </Tooltip>
                )}

                {!props.readonly && planner.asset?.path ? (
                    <Button
                        data-kap-id={'plan-editor-top-menu-open-folder'}
                        title={`Open ${planner.asset!.path}`}
                        onClick={() => {
                            window.electron.ipcRenderer.invoke('open-path', planner.asset!.path);
                        }}
                    >
                        Open folder
                    </Button>
                ) : null}
            </Stack>

            <KapDialog open={showSettings} className="modal-plan-settings" onClose={() => setShowSettings(false)}>
                <KapDialog.Title>Plan settings</KapDialog.Title>
                <KapDialog.Content>
                    <FormContainer
                        initialValue={formData}
                        onSubmitData={async (data) => {
                            if (planner.plan && planner.plan.spec.blocks && planner.plan.spec.blocks.length > 0) {
                                const newPlanUri = parseKapetaUri(data.metadata.name);
                                const oldPlanUri = parseKapetaUri(planner.plan.metadata.name);
                                const blockDefinitionRefs: BlockDefinitionReference[] = [];

                                if (
                                    planner.plan.metadata.visibility !== data.metadata.visibility &&
                                    data.metadata.visibility === 'public'
                                ) {
                                    const changeVisibility = await confirm({
                                        title: 'Visibility change',
                                        cancellationText: 'No, Cancel change',
                                        confirmationText: 'Yes, Change all blocks to public',
                                        content:
                                            'You are about to change the plan to public. All blocks must also be public to be able to publish the plan. Do you want to change the visibility of all blocks?',
                                    });

                                    if (!changeVisibility) {
                                        return;
                                    }

                                    planner.plan.spec.blocks.forEach((instance) => {
                                        const blockUri = parseKapetaUri(instance.block.ref);
                                        if (blockUri.version !== 'local') {
                                            return;
                                        }

                                        const block = planner.getBlockByRef(instance.block.ref);
                                        if (!block) {
                                            return;
                                        }

                                        if (block.metadata.visibility === 'public') {
                                            return;
                                        }

                                        if (blockDefinitionRefs.some((b) => b.ref === instance.block.ref)) {
                                            return;
                                        }

                                        blockDefinitionRefs.push({
                                            ref: instance.block.ref,
                                            update: {
                                                ...block,
                                                metadata: {
                                                    ...block.metadata,
                                                    visibility: 'public',
                                                },
                                            },
                                        });
                                    });
                                }

                                if (oldPlanUri.handle !== newPlanUri.handle) {
                                    // Ask if we should change the block refs
                                    const changeBlockRefs = await confirm({
                                        title: 'Confirm ownership change',
                                        cancellationText: 'No, Keep handles on blocks',
                                        confirmationText: 'Yes, Change handles on blocks',
                                        content:
                                            'You are about to change the handle of this plan. Do you also want to change the same handle of blocks in this plan?',
                                    });

                                    if (changeBlockRefs) {
                                        for (const instance of planner.plan.spec.blocks) {
                                            const blockUri = parseKapetaUri(instance.block.ref);

                                            if (blockUri.handle !== oldPlanUri.handle || blockUri.version !== 'local') {
                                                continue;
                                            }

                                            const block = planner.getBlockById(instance.id);
                                            if (!block) {
                                                continue;
                                            }

                                            let blockDefinitionRef = blockDefinitionRefs.find(
                                                (b) => b.ref === instance.block.ref
                                            );
                                            if (!blockDefinitionRef) {
                                                blockDefinitionRef = {
                                                    ref: instance.block.ref,
                                                    update: _.cloneDeep(block),
                                                };
                                                blockDefinitionRefs.push(blockDefinitionRef);
                                            }

                                            blockUri.handle = newPlanUri.handle;
                                            blockDefinitionRef.update.metadata.name = blockUri.fullName;
                                        }
                                    }
                                }

                                if (blockDefinitionRefs.length > 0) {
                                    planner.updateBlockDefinitions(blockDefinitionRefs);
                                }
                            }

                            const defaultConfig = createGlobalConfigurationFromEntities(
                                data.spec.configuration,
                                data.configuration
                            );

                            planner.updatePlanMetadata(data.metadata, data.spec.configuration, defaultConfig);
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
                                    value={settingsTab}
                                    onChange={(evt, tabId) => setSettingsTab(tabId)}
                                >
                                    <Tab value="general" label="General" />
                                    {hasConfig && <Tab value="configuration" label="Configuration" />}
                                    {!props.readonly && <Tab value="config-schema" label="Configuration Schema" />}
                                </Tabs>
                            </Box>
                            <Box
                                flex={1}
                                minHeight={'300px'}
                                minWidth={'500px'}
                                sx={{
                                    '.dsl-editor': {
                                        height: '298px',
                                    },
                                }}
                            >
                                {settingsTab === 'general' && <PlanForm readOnly={props.readonly} />}
                                {settingsTab === 'configuration' && (
                                    <Box>
                                        <InfoBox>
                                            Define the local configuration values for this Plan. Will be used when you
                                            run it locally.
                                        </InfoBox>
                                        <ConfigValueEditor systemId={props.systemId} />
                                    </Box>
                                )}
                                {settingsTab === 'config-schema' && !props.readonly && (
                                    <Box>
                                        <InfoBox>
                                            Define the configuration schema for this Plan.{' '}
                                            <a href={'https://docs.kapeta.com/v1/docs/configuration'} target={'_blank'}>
                                                <i className="fal fa-info-circle" /> Read more
                                            </a>
                                        </InfoBox>
                                        <ConfigSchemaEditor systemId={props.systemId} />
                                    </Box>
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
                </KapDialog.Content>
            </KapDialog>

            <Popover
                open={Boolean(publishButton)}
                anchorEl={publishButton}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                onClose={() => setPublishButton(null)}
            >
                <Box
                    sx={{
                        width: 400,
                        pt: 2,
                        px: 4,
                        pb: 3,
                    }}
                >
                    <Typography variant="h5">Publish to Kapeta</Typography>
                    <Typography variant="body2">
                        Publish your plan to Kapeta to be able to run this plan in a cloud environment and/or share it
                        with others.
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            mt: 1,
                            fontWeight: 600,
                        }}
                    >
                        Note: You can also publish via CI/CD -{' '}
                        <a href="https://docs.kapeta.com/docs/working-with-cicd" target={'_blank'}>
                            see the docs
                        </a>{' '}
                        for more info.
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            mt: 1,
                        }}
                    >
                        To publish now run the following command in your terminal:
                        <CodeBlock
                            language={'bash'}
                            copyable={true}
                            code={[`cd ${planner.asset!.path}`, `kap registry publish`].join('\n')}
                        />
                    </Typography>
                </Box>
            </Popover>

            {showPlanTakesTimeTip && (
                <TipBox
                    id={'starting-your-plan'}
                    title={'Starting your Plan'}
                    icon={<CoffeeIcon />}
                    description={`Kapeta is pulling docker images and spinning up databases - the first time you start a Plan or a new Block this could take several minutes. Now might be a good time to get that fresh cup of coffee.`}
                />
            )}
        </Paper>
    );
};
