import React from 'react';

import './index.less';
import {ThemeProvider} from "@mui/material";
import { ProcessingContent } from '../src/renderer/modals/processing/ProcessingContent';
import {kapetaLight} from "../src/renderer/Theme";

export default {
    title: 'Processing Modal',
};

export const ProcessingModal = () => {
    return (
        <ThemeProvider theme={kapetaLight}>
            <ProcessingContent
                text="Continue signing in, in your browser..."
                linkText="Continue in browser"
                link="https://kapeta.com"
            />
        </ThemeProvider>
    );
};
