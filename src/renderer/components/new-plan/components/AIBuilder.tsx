/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Alert, Box } from '@mui/material';
import { PromptExamples } from './PromptExamples';
import { PromptInput } from './PromptInput';
import { useState } from 'react';
import { ChatMessages } from './ChatMessages';
import { AIChatMessage } from '../aiTypes';
import { aiService } from '../../../api/AIService';

export interface AIBuilderProps {
    handle: string | undefined;
    setPlan: (p: { plan: any; blocks: any }) => void;
}

export const AIBuilder = (props: AIBuilderProps) => {
    const { handle, setPlan } = props;

    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [threadId, setThreadId] = useState();

    const sendPrompt = async (p: string) => {
        setIsLoading(true);
        setHasError(false);
        try {
            if (!handle) {
                throw new Error('No handle');
            }
            const response = await aiService.sendPrompt(handle, p, threadId);

            if (response.threadId) {
                setThreadId(response.threadId);
            }
            setMessages((prevMessages) => {
                return [...prevMessages, { role: 'assistant', content: response.explanation }];
            });
            setPlan({
                plan: response.context.plan,
                blocks: response.context.blocks,
            });
        } catch (error) {
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const [messages, setMessages] = useState<AIChatMessage[]>([]);
    const hasMessages = messages.length > 0;

    const [prevPrompt, setPrevPrompt] = useState('');
    const [prompt, setPrompt] = useState('');

    return (
        <>
            {!hasMessages ? (
                <Box>
                    <PromptExamples onClickExample={(text) => setPrompt(text)} />

                    <Alert severity="info" sx={{ mt: 4 }}>
                        Helper text goes here
                    </Alert>
                </Box>
            ) : (
                <ChatMessages
                    messages={messages}
                    isLoading={isLoading}
                    hasError={hasError}
                    onTryAgain={() => sendPrompt(prevPrompt)}
                />
            )}

            <PromptInput
                prompt={prompt}
                setPrompt={setPrompt}
                onSend={() => {
                    sendPrompt(prompt);
                    setMessages((messages) => [
                        ...messages,
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ]);
                    setPrevPrompt(prompt);
                    setPrompt('');
                }}
            />
        </>
    );
};
