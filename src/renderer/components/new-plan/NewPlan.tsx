/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import CreateModeToggle, { CreateMode } from './components/CreateModeToggle';
import { Paper } from '@mui/material';
import { Box } from '@mui/system';
import { AIBuilder } from './components/AIBuilder';
import { useState } from 'react';
import { DraftPlanView } from './components/DraftPlanView';
import { BlockDefinition, Plan } from '@kapeta/schemas';
import { useKapetaContext } from '../../hooks/contextHook';
import { useNavigate } from 'react-router-dom';
import { AssetService } from 'renderer/api/AssetService';
import { FileSystemService } from 'renderer/api/FileSystemService';

export const NewPlan = () => {
    const kapetaContext = useKapetaContext();
    const handle = kapetaContext.activeContext?.identity.handle;

    const [plan, setPlan] = useState<{ plan: Plan | undefined; blocks: BlockDefinition[] | undefined }>({
        plan: undefined,
        blocks: undefined,
    });

    const [createMode, setCreateMode] = useState<CreateMode>('ai');
    const onUsePlan = async () => {
        if (!plan.plan || !plan.blocks) {
            return;
        }

        const projectHome = await FileSystemService.getProjectFolder();
        // Create blocks for plan
        await Promise.all([
            ...plan.blocks.map((block) =>
                AssetService.create(`${projectHome}/${block.metadata.name}/kapeta.yml`, block).catch((err) => {
                    if ((err.message as string).startsWith('File already exists')) {
                        // everything is fine.
                        return;
                    }
                    throw err;
                })
            ),
        ]);

        // Create plan
        await AssetService.create(`${projectHome}/${plan.plan.metadata.name}/kapeta.yml`, plan.plan);

        navigateToPlan(`${plan.plan.metadata.name}:local`);
    };

    const navigate = useNavigate();
    const navigateToPlan = (ref: string) => {
        navigate(`/edit/${encodeURIComponent(ref)}`);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'stretch',
                height: '100%',
            }}
        >
            <Paper
                sx={{
                    width: '600px',
                    minWidth: '600px',
                    p: 4,
                    zIndex: 2,
                    borderRadius: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'stretch',
                }}
                elevation={10}
            >
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CreateModeToggle createMode={createMode} onChange={(mode: CreateMode) => setCreateMode(mode)} />
                </Box>

                {createMode === 'ai' ? <AIBuilder handle={handle} setPlan={setPlan} /> : null}
            </Paper>

            {/* Planner */}
            <DraftPlanView plan={plan.plan} blocks={plan.blocks} onSubmit={onUsePlan} />
        </Box>
    );
};
