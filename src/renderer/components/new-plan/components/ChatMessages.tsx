import { Box } from '@mui/material';

interface ChatMessageProps {}

export interface ChatMessagesProps {
    // messages:
}

export const ChatMessages = (props: ChatMessagesProps) => {
    const {} = props;

    return (
        <Box
            sx={{
                height: '100%',
            }}
        >
            ChatMessages
        </Box>
    );
};
