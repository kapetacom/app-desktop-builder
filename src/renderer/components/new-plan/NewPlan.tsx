import CreateModeToggle, { CreateMode } from './components/CreateModeToggle';
import { Paper } from '@mui/material';
import { Box } from '@mui/system';
import { AIBuilder } from './components/AIBuilder';
import { useState } from 'react';

export interface NewPlanProps {}

export const NewPlan = (props: NewPlanProps) => {
    const {} = props;

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
            ></Box>
        </Box>
    );
};
