/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Alert, Box, Stack } from '@mui/material';
import { PromptExamples } from './PromptExamples';
import { PromptInput } from './PromptInput';
import { useState } from 'react';
import { ChatMessages } from './ChatMessages';
import { AIChatMessage } from '../aiTypes';
import { aiService } from '../../../api/AIService';
import { useList } from 'react-use';

export interface AIBuilderProps {
    handle: string | undefined;
    setPlan: (p: { plan: any; blocks: any }) => void;
}

export const AIBuilder = (props: AIBuilderProps) => {
    const { handle, setPlan } = props;

    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [messages, setMessages] = useState<AIChatMessage[]>([]);

    const appendMessage = (message: AIChatMessage) => {
        setMessages((prevMessages) => [...prevMessages, message]);
        return message;
    };

    const sendPrompt = async (specificMessages?: AIChatMessage[]) => {
        setIsLoading(true);
        setHasError(false);
        try {
            if (!handle) {
                throw new Error('No handle');
            }

            const response = await aiService.sendPrompt(handle, specificMessages ?? messages);

            if (response.response) {
                appendMessage({ role: 'assistant', content: response.response });
            }

            if (response?.context?.plan) {
                setPlan({
                    plan: response.context.plan,
                    blocks: response.context.blocks,
                });
            }
        } catch (error) {
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const writePrompt = async (prompt: string) => {
        const newMessage = appendMessage({ role: 'user', content: prompt });
        return sendPrompt([...messages, newMessage]);
    };

    const hasMessages = messages.length > 0;

    const [prompt, setPrompt] = useState('');

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
            }}
        >
            {!hasMessages ? (
                <Box sx={{ mb: 2 }}>
                    <PromptExamples onClickExample={(text) => writePrompt(text)} />

                    <Alert severity="info" sx={{ mt: 4 }}>
                        Explain what your system should do in plain english below. <br />
                        You can skip this by just changing to the "Settings" tab and filling in the details there.
                    </Alert>
                </Box>
            ) : (
                <ChatMessages
                    messages={messages}
                    isLoading={isLoading}
                    hasError={hasError}
                    onTryAgain={() => sendPrompt()}
                />
            )}

            <Box>
                <PromptInput
                    prompt={prompt}
                    disabled={isLoading}
                    setPrompt={setPrompt}
                    onSend={() => {
                        writePrompt(prompt);
                        setPrompt('');
                    }}
                />
            </Box>
        </Box>
    );
};
