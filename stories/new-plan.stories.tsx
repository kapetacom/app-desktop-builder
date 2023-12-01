/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { ThemeProvider } from '@mui/material';
import { NewPlan } from '../src/renderer/components/new-plan/NewPlan';
import { kapetaLight } from '../src/renderer/Theme';
import { ChatMessages } from '../src/renderer/components/new-plan/components/ChatMessages';
import { useState } from 'react';

export default {
    title: 'New Plan',
};

export const NewPlanWithAI = () => {
    return (
        <ThemeProvider theme={kapetaLight}>
            <NewPlan handle="johndoe" />
        </ThemeProvider>
    );
};

export const LoadingChatMessages = () => {
    return (
        <ThemeProvider theme={kapetaLight}>
            <ChatMessages messages={[{ role: 'user', content: 'Todo app with reminders' }]} isLoading />
        </ThemeProvider>
    );
};

export const FailingAIReqestMessages = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    setTimeout(() => {
        setIsLoading(false);
        setHasError(true);
    }, 1000);

    return (
        <ThemeProvider theme={kapetaLight}>
            <ChatMessages
                messages={[{ role: 'user', content: 'Todo app with reminders' }]}
                isLoading={isLoading}
                hasError={hasError}
            />
        </ThemeProvider>
    );
};
