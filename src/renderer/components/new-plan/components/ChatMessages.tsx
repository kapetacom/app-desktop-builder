import { Box } from '@mui/material';
import { AIChatMessage } from '../aiTypes';
import { ChatMessage } from './ChatMessage';

export interface ChatMessagesProps {
    messages: AIChatMessage[];
}

export const ChatMessages = (props: ChatMessagesProps) => {
    const { messages } = props;

    return (
        <Box
            sx={{
                height: '100%',
                py: 4,
            }}
        >
            {messages.map((message, index) => (
                <ChatMessage message={message} />
            ))}
        </Box>
    );
};
