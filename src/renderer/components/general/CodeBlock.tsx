import { Box, IconButton, Typography } from '@mui/material';
import grey from '@mui/material/colors/grey';
import React from 'react';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import CheckIcon from '@mui/icons-material/Check';
import { showError } from '../../../main/helpers';
import { showToasty, ToastType } from '@kapeta/ui-web-components';

interface Props {
    code: string;
    language: string;
    copyable?: boolean;
}
export const CodeBlock = (props: Props) => {
    const [copied, setCopied] = React.useState(false);

    return (
        <Box
            sx={{
                backgroundColor: grey[800],
                color: grey[100],
                p: 1,
                borderRadius: 1,
                position: 'relative',
                '.MuiIconButton-root': {
                    opacity: 0,
                },
                '&:hover': {
                    '.MuiIconButton-root': {
                        opacity: 1,
                    },
                },
            }}
        >
            <Box
                component="pre"
                sx={{
                    p: 0,
                    m: 0,
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                }}
            >
                {props.code}
            </Box>
            {props.copyable && (
                <IconButton
                    size="small"
                    sx={{
                        m: 0,
                        p: 0,
                        position: 'absolute',
                        top: 8,
                        right: 2,
                        backgroundColor: grey[800],
                        color: copied ? 'green.300' : 'grey.100',
                        '&:hover': {
                            backgroundColor: grey[800],
                        },
                    }}
                    onClick={async () => {
                        try {
                            await window.navigator.clipboard.writeText(props.code);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 5000);
                        } catch (e) {
                            console.warn('Failed to copy to clipboard', e);
                            showToasty({
                                title: 'Error',
                                message: 'Failed to copy to clipboard',
                                type: ToastType.ALERT,
                            });
                        }
                    }}
                >
                    {copied && <CheckIcon fontSize={'small'} />}
                    {!copied && <CopyAllIcon fontSize={'small'} />}
                </IconButton>
            )}
        </Box>
    );
};
