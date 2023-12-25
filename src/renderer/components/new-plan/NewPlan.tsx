/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import CreateModeToggle, { CreateMode } from './components/CreateModeToggle';
import { Button, Paper } from '@mui/material';
import { Box } from '@mui/system';
import { AIBuilder } from './components/AIBuilder';
import React, { useEffect, useMemo, useState } from 'react';
import { DraftPlanView } from './components/DraftPlanView';
import { BlockDefinition, Metadata, Plan } from '@kapeta/schemas';
import { AssetService } from '../../api/AssetService';
import { useKapetaContext } from '../../hooks/contextHook';
import { FileSystemService } from '../../api/FileSystemService';
import { useMainTabs } from '../../hooks/mainTabs';
import { PlanForm } from '../forms/PlanForm';
import {
    FormButtons,
    FormContainer,
    FormField,
    FormFieldType,
    FormSelect,
    showToasty,
    ToastType,
} from '@kapeta/ui-web-components';
import { ProjectHomeFolderInput } from '../fields/ProjectHomeFolderInput';
import { showFilePickerOne } from '../../utils/showFilePicker';
import Path from 'path';
import _ from 'lodash';
import { KapetaURI, parseKapetaUri } from '@kapeta/nodejs-utils';
import { getBlockFolderForPlan } from '../plan-editor/helpers';

export interface NewPlanProps {}

export const NewPlan = (props: NewPlanProps) => {
    const context = useKapetaContext();
    const mainTabs = useMainTabs();
    const handle = context.contexts?.current ?? context.profile?.handle!;
    const [useProjectHome, setUseProjectHome] = useState<boolean>();
    const [projectHome, setProjectHome] = useState<string>();

    const initialPlanMetadata = useMemo<Plan>(() => {
        return {
            kind: 'core/plan',
            metadata: {
                name: handle ? `${handle}/` : '',
                visibility: 'private',
                description: '',
                structure: 'mono',
            },
            spec: {
                blocks: [],
                connections: [],
            },
        };
    }, [handle]);

    const [planMetaData, setPlanMetaData] = useState<Plan>(initialPlanMetadata);
    const [generatedPlanMetadata, setGeneratedPlanMetadata] = useState<Metadata>();
    const [plan, setPlan] = useState<{ plan: Plan | undefined; blocks: BlockDefinition[] | undefined }>({
        plan: undefined,
        blocks: undefined,
    });

    const [createMode, setCreateMode] = useState<CreateMode>('manual');
    const onCreate = async () => {
        if (!plan.plan && !planMetaData) {
            return;
        }

        const planData = _.cloneDeep({
            ...planMetaData,
            ...plan.plan,
            metadata: {
                ...plan.plan?.metadata,
                ...planMetaData.metadata,
            },
        });

        const structure = planMetaData.metadata.structure ?? 'mono';
        const homeFolder = projectHome ?? (await FileSystemService.getProjectFolder());
        let planUri: KapetaURI;
        try {
            planUri = parseKapetaUri(planData.metadata.name);
        } catch (e) {
            showToasty({
                type: ToastType.ALERT,
                message: `Plan name was invalid`,
                title: 'Error',
            });
            return;
        }
        let planPath = Path.join(homeFolder, planData.metadata.name);
        if (!useProjectHome) {
            const result = await showFilePickerOne({
                title: 'Choose a folder',
                selectDirectory: true,
            });
            if (!result) {
                return;
            }
            planPath = result.path;
        }

        const getPath = (nameUri: KapetaURI) => {
            return structure === 'mono'
                ? Path.join(getBlockFolderForPlan(planPath), nameUri.name, 'kapeta.yml')
                : Path.join(homeFolder, nameUri.fullName, 'kapeta.yml');
        };

        // Create plan
        try {
            if (plan.blocks) {
                const blockInfos = await Promise.all(
                    plan.blocks.map(async (block) => {
                        const copy = _.cloneDeep(block);
                        const nameUri = parseKapetaUri(block.metadata.name);
                        nameUri.handle = planUri.handle;

                        const originalName = nameUri.name;
                        let iteration = 1;
                        while (true) {
                            const tmpPath = getPath(nameUri);
                            if (await FileSystemService.exists(tmpPath)) {
                                nameUri.name = originalName + '-' + iteration++;
                                continue;
                            }
                            break;
                        }

                        const path = getPath(nameUri);

                        if (structure === 'mono') {
                            nameUri.name = planUri.name + '-' + nameUri.name;
                        }

                        planData.spec.blocks.forEach((b) => {
                            const uri = parseKapetaUri(b.block.ref);
                            if (uri.fullName === block.metadata.name) {
                                uri.handle = nameUri.handle;
                                uri.name = nameUri.name;
                                b.block.ref = uri.toNormalizedString();
                            }
                        });

                        copy.metadata.name = nameUri.fullName;

                        return {
                            path,
                            block: copy,
                        };
                    })
                );

                // Create blocks for plan
                await Promise.all(
                    blockInfos.map(({ block, path }) => {
                        return AssetService.create(path, block).catch((err) => {
                            if ((err.message as string).startsWith('File already exists')) {
                                // everything is fine.
                                return;
                            }
                            throw err;
                        });
                    })
                );
            }
            await AssetService.create(`${planPath}/kapeta.yml`, planData);
        } catch (err: any) {
            showToasty({
                type: ToastType.ALERT,
                message: `Failed to create plan: ${err.message}`,
                title: 'Error',
            });
            return;
        }

        navigateToPlan(`${planData.metadata.name}:local`);
    };

    const navigateToPlan = (ref: string) => {
        mainTabs.open(`/edit/${encodeURIComponent(ref)}`, {
            navigate: true,
        });
        mainTabs.close('/new-plan');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'stretch',
                height: '100%',
            }}
        >
            <FormContainer
                initialValue={planMetaData}
                onChange={(data: any) => {
                    if (!_.isEqual(data.metadata, planMetaData.metadata)) {
                        setPlanMetaData(data);
                    }
                }}
                onSubmitData={onCreate}
            >
                <Paper
                    sx={{
                        width: '600px',
                        minWidth: '600px',
                        p: 4,
                        height: '100%',
                        boxSizing: 'border-box',
                        zIndex: 2,
                        borderRadius: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'stretch',
                        '.tab-page': {
                            flexGrow: 1,
                            overflowY: 'hidden',
                        },
                    }}
                    elevation={10}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <CreateModeToggle
                            createMode={createMode}
                            onChange={(mode: CreateMode) => setCreateMode(mode)}
                        />
                    </Box>

                    <Box
                        className="tab-page"
                        sx={{
                            display: createMode === 'ai' ? 'block' : 'none',
                        }}
                    >
                        <AIBuilder
                            handle={handle}
                            setPlan={(data) => {
                                setPlan(data);
                                if (planMetaData?.metadata) {
                                    const metadata = _.cloneDeep(planMetaData?.metadata);
                                    if (
                                        !metadata.name ||
                                        metadata.name.endsWith('/') ||
                                        generatedPlanMetadata?.name === metadata.name
                                    ) {
                                        metadata.name = data.plan.metadata.name;
                                    }

                                    if (!metadata.title || generatedPlanMetadata?.title === metadata.title) {
                                        metadata.title = data.plan.metadata.title;
                                    }

                                    if (
                                        !metadata.description ||
                                        generatedPlanMetadata?.description === metadata.description
                                    ) {
                                        metadata.description = data.plan.metadata.description;
                                    }

                                    setPlanMetaData({
                                        ...planMetaData,
                                        metadata,
                                    });
                                }

                                setGeneratedPlanMetadata(data.plan.metadata);
                            }}
                        />
                    </Box>
                    <Box
                        className="tab-page"
                        sx={{
                            display: createMode !== 'ai' ? 'block' : 'none',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                overflowY: 'auto',
                            }}
                        >
                            <PlanForm creating={true} />

                            <ProjectHomeFolderInput
                                onChange={(newUseProjectHome, newProjectHome) => {
                                    setUseProjectHome(newUseProjectHome);
                                    setProjectHome(newProjectHome);
                                }}
                            />

                            <FormButtons>
                                <Button
                                    color={'error'}
                                    variant={'contained'}
                                    onClick={() => {
                                        mainTabs.close('/new-plan');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button color={'primary'} type={'submit'} variant={'contained'}>
                                    Create
                                </Button>
                            </FormButtons>
                        </Box>
                    </Box>
                </Paper>
            </FormContainer>

            {/* Planner */}
            <DraftPlanView plan={plan.plan} blocks={plan.blocks} onSubmit={onCreate} />
        </Box>
    );
};
