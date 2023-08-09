import React from 'react';

import './index.less';
import { ThemeProvider } from '@mui/material';
import { ProcessingContent } from '../src/renderer/modals/processing/ProcessingContent';
import { kapetaLight } from '../src/renderer/Theme';

export default {
    title: 'Processing Modal',
};

export const ProcessingModal = () => {
    return (
        <div style={{ width: '400px' }}>
            <ThemeProvider theme={kapetaLight}>
                <ProcessingContent
                    title={'Signing in...'}
                    text="We are signing you in to Kapeta in your browser. This will log you in to your Kapeta account. If you cancel, you will not be able to sign in to Kapeta."
                    linkText="View in browser"
                    link="https://kapeta.com"
                />
            </ThemeProvider>
        </div>
    );
};
