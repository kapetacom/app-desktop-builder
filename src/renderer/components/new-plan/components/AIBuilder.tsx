import { Alert, Box } from '@mui/material';
import { PromptExamples } from './PromptExamples';
import { PromptInput } from './PromptInput';
import { useState } from 'react';
import { ChatMessages } from './ChatMessages';
import { AIChatMessage } from '../aiTypes';

export interface AIBuilderProps {}

export const AIBuilder = (props: AIBuilderProps) => {
    const {} = props;

    const [messages, setMessages] = useState<AIChatMessage[]>([
        {
            role: 'user',
            content: 'Hello, how are you?',
        },
        {
            role: 'assistant',
            content:
                '# Hello there \n\nI am fine, thank you! \n\n## Bullets \n\n- First\n- Second\n- Third\n\n```\nconst foo=1;\n```',
            threadId: '1',
        },
        {
            role: 'user',
            content: 'I would like to build a banking app',
            threadId: '1',
        },
    ]);
    const hasMessages = messages.length > 0;

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
                <ChatMessages messages={messages} />
            )}

            <PromptInput
                prompt={prompt}
                setPrompt={setPrompt}
                onSend={() => {
                    setMessages((messages) => [
                        ...messages,
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ]);
                    setPrompt('');
                }}
            />
        </>
    );
};
