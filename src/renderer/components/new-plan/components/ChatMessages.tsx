/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Box } from '@mui/material';
import { AIChatMessage } from '../aiTypes';
import { ChatMessage } from './ChatMessage';
import { useKapetaContext } from '../../../hooks/contextHook';

export interface ChatMessagesProps {
    messages: AIChatMessage[];
    /**
     * `true` while waiting for AI to respond to user
     */
    isLoading?: boolean;
    /**
     * `true` if AI failed to return a valid response
     */
    hasError?: boolean;
    /**
     * Called when the user wants to try again after an error
     */
    onTryAgain?: () => void;
}

export const ChatMessages = (props: ChatMessagesProps) => {
    const { messages, isLoading, hasError, onTryAgain } = props;

    return (
        <Box
            sx={{
                flex: 1,
                height: '100%',
                py: 4,
                overflowY: 'scroll',
            }}
        >
            {messages.map((message, index) => (
                <ChatMessage message={message} key={index} />
            ))}
            {isLoading && <ChatMessage message={{ role: 'assistant', content: '' }} isLoading />}
            {hasError && <ChatMessage message={{ role: 'assistant', content: '' }} hasError onTryAgain={onTryAgain} />}
        </Box>
    );
};
