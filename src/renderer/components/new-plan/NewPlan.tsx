import CreateModeToggle, { CreateMode } from './components/CreateModeToggle';
import { Paper } from '@mui/material';
import { Box } from '@mui/system';
import { AIBuilder } from './components/AIBuilder';
import { useState } from 'react';
import { DraftPlanView } from './components/DraftPlanView';
import { useAsyncRetry } from 'react-use';
import { aiService } from 'renderer/api/AIService';
import { BlockDefinition, Plan } from '@kapeta/schemas';

export interface NewPlanProps {
    handle: string;
}

export const NewPlan = (props: NewPlanProps) => {
    const { handle = 'kapeta' } = props;

    const [createMode, setCreateMode] = useState<CreateMode>('ai');

    const [plan, setPlan] = useState<{ plan: Plan | undefined; blocks: BlockDefinition[] | undefined }>({
        plan: undefined,
        blocks: undefined,
    });

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

                {createMode === 'ai' ? <AIBuilder setPlan={setPlan} /> : null}
            </Paper>

            {/* Planner */}
            <Box
                sx={{
                    backgroundColor: '#F6F1EE',
                    flexGrow: 1,
                    zIndex: 1,
                }}
            >
                <DraftPlanView plan={plan.plan} blocks={plan.blocks} />
            </Box>
        </Box>
    );
};
