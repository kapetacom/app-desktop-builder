import { ThemeProvider } from '@mui/material';
import { NewPlan } from '../src/renderer/components/new-plan/NewPlan';
import { kapetaLight } from '../src/renderer/Theme';

export default {
    title: 'New Plan',
};

export const NewPlanWithAI = () => {
    return (
        <ThemeProvider theme={kapetaLight}>
            <NewPlan />
        </ThemeProvider>
    );
};
