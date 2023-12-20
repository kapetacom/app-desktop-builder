/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Box, Button, CircularProgress, SxProps, Typography, useTheme } from '@mui/material';
import { AIChatMessage } from '../aiTypes';
import { Markdown, UserAvatar } from '@kapeta/ui-web-components';
import { KapetaIcon } from '../../shell/components/KapetaIcon';
import { useRandomMessage } from './useRandomMessage';
import { useKapetaContext } from '../../../hooks/contextHook';

export interface ChatMessageProps {
    message: AIChatMessage;
    isLoading?: boolean;
    hasError?: boolean;
    onTryAgain?: () => void;
}

const AssistantAvatar = (props: { isLoading?: boolean }) => {
    const { palette } = useTheme();
    return (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#cfcfcf69',
                width: '40px',
                minWidth: '40px',
                height: '40px',
                minHeight: '40px',
                borderRadius: '50%',
                'svg path': {
                    fill: palette.primary.main,
                },
                padding: '5px',
                boxSizing: 'border-box',
            }}
        >
            <KapetaIcon />
            {props.isLoading && (
                <CircularProgress
                    sx={{
                        position: 'absolute',
                    }}
                    size={40}
                    variant="indeterminate"
                    thickness={1}
                    color="primary"
                />
            )}
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
        fontSize: '14px',
        fontWeight: 400,
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
        padding: '2px 4px',
        borderRadius: '4px',
    },

    '> :first-child': {
        marginTop: 0,
    },

    '> :last-child': {
        marginBottom: 0,
    },
};

export const ChatMessage = (props: ChatMessageProps) => {
    const kapetaContext = useKapetaContext();

    const {
        message: { role, content },
        isLoading,
        hasError,
        onTryAgain,
    } = props;

    const loadingText = useRandomMessage(
        [
            'Reading your prompt like a detective finding clues.',
            "Thinking, 'What would a Software Architect guru do?'",
            'Designing a system so sleek, it could wear a tuxedo.',
            'Getting my architecture wizard hat on.',
            'Crafting an architecture so cool, it needs its own soundtrack.',
            'Considering plan B, C, and even D, just in case.',
            "Quality-checking like it's a five-star software hotel.",
            'Wrapping it up with a bow and serving it with style.',
        ],
        3000
    );

    const showUserMessage = role === 'user';
    const showAssistantMessage = role === 'assistant' && !isLoading && !hasError;
    const showAssistancentLoadingMessage = role === 'assistant' && isLoading;
    const showAssistancentErrorMessage = role === 'assistant' && hasError;

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
                    name={kapetaContext.profile?.name ?? kapetaContext.profile?.handle ?? 'Unknown'} // TODO: Get real name of user
                    size={40}
                />
            )}
            {role === 'assistant' && <AssistantAvatar isLoading={isLoading} />}

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
                    ...(hasError
                        ? {
                              border: (theme) => `1px solid ${theme.palette.error.main}`,
                              color: (theme) => theme.palette.error.main,
                          }
                        : {}),
                }}
            >
                {showUserMessage && <Typography variant="body1">{content}</Typography>}

                {showAssistantMessage && (
                    <Box sx={MarkdownStyles}>
                        <Markdown content={content} />
                    </Box>
                )}

                {showAssistancentLoadingMessage && <Typography variant="body1">{loadingText}</Typography>}

                {showAssistancentErrorMessage && (
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                        <Typography variant="body1">
                            Something went wrong. Please try again or contact support.
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{
                                whiteSpace: 'nowrap',
                            }}
                            onClick={onTryAgain}
                        >
                            Try again
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
