import { Alert, Box } from '@mui/material';
import { PromptExamples } from './PromptExamples';
import { PromptInput } from './PromptInput';
import { useState } from 'react';
import { ChatMessages } from './ChatMessages';
import { AIChatMessage } from '../aiTypes';
import { useAsyncRetry } from 'react-use';
import { aiService } from '../../../api/AIService';

export interface AIBuilderProps {
    setPlan: (p: { plan: any; blocks: any }) => void;
}

export const AIBuilder = (props: AIBuilderProps) => {
    const { setPlan } = props;

    const handle = 'kapeta';

    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [threadId, setThreadId] = useState();

    const sendPrompt = async (p: string) => {
        setIsLoading(true);
        setHasError(false);
        try {
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
