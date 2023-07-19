import React from 'react';

import './index.less';
import { ProcessingContent } from '../src/renderer/modals/processing/processing';

export default {
    title: 'Processing Modal',
};

export const ProcessingModal = () => {
    return (
        <ProcessingContent
            text="Doing something that takes time..."
            linkText="Click here to open in your browser."
            link="https://kapeta.com"
        />
    );
};
