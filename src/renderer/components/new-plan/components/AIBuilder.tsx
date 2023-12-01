import { Alert, Box } from '@mui/material';
import { PromptExamples } from './PromptExamples';
import { PromptInput } from './PromptInput';
import { useState } from 'react';
import { ChatMessages } from './ChatMessages';

export interface AIBuilderProps {}

export const AIBuilder = (props: AIBuilderProps) => {
    const {} = props;

    const [prompt, setPrompt] = useState('');

    const hasPrompt = Boolean(prompt.trim());

    return (
        <>
            {!hasPrompt ? (
                <Box>
                    <PromptExamples onClickExample={(text) => setPrompt(text)} />

                    <Alert severity="info" sx={{ mt: 4 }}>
                        Helper text goes here
                    </Alert>
                </Box>
            ) : (
                <ChatMessages />
            )}

            <PromptInput prompt={prompt} setPrompt={setPrompt} />
        </>
    );
};
