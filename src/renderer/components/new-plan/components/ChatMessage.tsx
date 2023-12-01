import { Box, SxProps, Typography, useTheme } from '@mui/material';
import { AIChatMessage } from '../aiTypes';
import { Markdown, UserAvatar } from '@kapeta/ui-web-components';
import { KapetaIcon } from '../../shell/components/KapetaIcon';

export interface ChatMessageProps {
    message: AIChatMessage;
}

const AssistantAvatar = () => {
    const { palette } = useTheme();
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#cfcfcf69',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                'svg path': {
                    fill: palette.primary.main,
                },
                padding: '5px',
                boxSizing: 'border-box',
            }}
        >
            <KapetaIcon />
        </Box>
    );
};

const MarkdownStyles: SxProps = {
    // Header styles
    'h1, h2, h3, h4, h5, h6': {
        marginTop: 0,
        fontWeight: 'bold',
    },
    h1: { fontSize: '16px' },
    h2: { fontSize: '14px' },
    h3: { fontSize: '12px' },
    h4: { fontSize: '10px' },
    h5: { fontSize: '8px' },
    h6: { fontSize: '6px' },

    // Styles for other elements
    p: {
        marginTop: 0,
    },
    a: {
        textDecoration: 'none',
        color: 'primary.main',
    },

    // Unordered List
    ul: {
        marginTop: 0,
        paddingLeft: '20px',
    },

    // Ordered List
    ol: {
        marginTop: 0,
        paddingLeft: '20px',
    },

    // List Item
    li: {
        marginTop: 0,
    },

    // Blockquote
    blockquote: {
        marginTop: 0,
        borderLeft: '4px solid',
        paddingLeft: '16px',
        fontStyle: 'italic',
    },

    // Code (inline and block)
    code: {
        fontFamily: '"Courier New", monospace',
        backgroundColor: 'grey.200',
        padding: '8px 12px',
        borderRadius: '4px',
        boxSizing: 'border-box',
        width: '100%',
        display: 'block',
    },
};

export const ChatMessage = (props: ChatMessageProps) => {
    const {
        message: { role, content },
    } = props;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                ':not(:first-child)': {
                    marginTop: '20px',
                },
            }}
        >
            {role === 'user' && (
                <UserAvatar
                    name={'Random User'} // TODO: Get real name of user
                />
            )}
            {role === 'assistant' && <AssistantAvatar />}

            <Box
                sx={{
                    width: '100%',
                    ...(role === 'assistant'
                        ? {
                              border: (theme) => `1px solid ${theme.palette.primary.main}`,
                              borderRadius: '12px',
                              padding: 3,
                          }
                        : {}),
                }}
            >
                {role === 'user' ? (
                    <Typography variant="body2">{content}</Typography>
                ) : (
                    <Box sx={MarkdownStyles}>
                        <Markdown content={content} />
                    </Box>
                )}
            </Box>
        </Box>
    );
};
