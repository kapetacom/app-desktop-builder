import { Box, IconButton, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useRef } from 'react';

export interface PromptInputProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    onSend: () => void;
}

export const PromptInput = (props: PromptInputProps) => {
    const { prompt, setPrompt, onSend } = props;

    const hasPrompt = Boolean(prompt.trim());

    const sendButtonRef = useRef<HTMLButtonElement>(null);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Tab') {
            event.preventDefault();
            sendButtonRef.current?.focus();
        }
    };

    return (
        <Box
            sx={{
                backgroundColor: '#FAFAFA',
                p: 4,
                mx: -4,
                mb: -4,
            }}
        >
            <TextField
                multiline
                minRows={3}
                maxRows={10}
                sx={{
                    width: '100%',
                    '& .MuiInputBase-root': {
                        borderRadius: '12px',
                        alignItems: 'flex-end',
                        '& .MuiInputBase-input': {
                            alignSelf: 'flex-start',
                        },
                    },
                }}
                InputProps={{
                    endAdornment: (
                        <IconButton size="medium" ref={sendButtonRef} disabled={!hasPrompt} onClick={onSend}>
                            <SendIcon color={hasPrompt ? 'primary' : 'disabled'} fontSize="small" />
                        </IconButton>
                    ),
                }}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
            />
        </Box>
    );
};
