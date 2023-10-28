import React from 'react';

import './index.less';
import { kapetaLight } from '../src/renderer/Theme';
import { ThemeProvider } from '@mui/material';
import { TipBox } from '../src/renderer/components/general/TipBox';
import CoffeeIcon from '../assets/images/coffee.svg';

export default {
    title: 'Tip Box',
};

export const StartingYourPlan = () => {
    return (
        <ThemeProvider theme={kapetaLight}>
            <TipBox
                id={'story-starting-your-plan'}
                title={'Starting your Plan'}
                icon={<CoffeeIcon />}
                description={`Kapeta is pulling docker images and spinning up databases - the first time you start a Plan or a new Block this could take several minutes. Now might be a good time to get that fresh cup of coffee.`}
            />
        </ThemeProvider>
    );
};
