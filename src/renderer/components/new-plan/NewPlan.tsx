import CreateModeToggle, { CreateMode } from './components/CreateModeToggle';
import { Paper } from '@mui/material';
import { Box } from '@mui/system';
import { AIBuilder } from './components/AIBuilder';
import { useState } from 'react';
import { DraftPlanView } from './components/DraftPlanView';
import { useAsyncRetry } from 'react-use';
import { aiService } from 'renderer/api/AIService';

export interface NewPlanProps {
    handle: string;
}

export const NewPlan = (props: NewPlanProps) => {
    const { handle = 'kapeta' } = props;

    const testPlan = useAsyncRetry(async () => {
        const response = await aiService.sendPrompt(
            handle,
            'An awesome demo plan with ponies and rainbows. Make sure the backend has a database.'
        );

        return {
            plan: response.context.plan,
            blocks: response.context.blocks,
        };
    }, []);

    console.log(testPlan.value);

    const [createMode, setCreateMode] = useState<CreateMode>('ai');

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

                {createMode === 'ai' ? <AIBuilder /> : null}
            </Paper>

            {/* Planner */}
            <Box
                sx={{
                    backgroundColor: '#F6F1EE',
                    flexGrow: 1,
                    zIndex: 1,
                }}
            >
                <DraftPlanView plan={testPlan.value?.plan} blocks={testPlan.value?.blocks} />
            </Box>
        </Box>
    );
};
