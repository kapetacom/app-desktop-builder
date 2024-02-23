/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';

import './index.less';
import { ThemeProvider } from '@mui/material';
import { ProcessingContent } from '../src/renderer/modals/processing/ProcessingContent';
import { kapetaLight } from '../src/renderer/Theme';
import { MemoryRouter } from 'react-router-dom';

export default {
    title: 'Processing Modal',
};

export const ProcessingModal = () => {
    return (
        <div style={{ width: '400px' }}>
            <MemoryRouter>
                <ThemeProvider theme={kapetaLight}>
                    <ProcessingContent
                        title={'Signing in...'}
                        text="We are signing you in to Kapeta in your browser. This will log you in to your Kapeta account. If you cancel, you will not be able to sign in to Kapeta."
                        linkText="View in browser"
                        link="https://kapeta.com"
                    />
                </ThemeProvider>
            </MemoryRouter>
        </div>
    );
};
