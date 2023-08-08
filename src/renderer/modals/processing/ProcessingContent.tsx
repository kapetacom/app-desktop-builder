import React from 'react';
import { Button,  Paper, Typography } from '@mui/material';

interface Props {
    title?: string | null;
    text: string | null;
    linkText: string | null;
    link: string | null;
    onLinkOpen?: (url) => void | Promise<void>;
    onCancel?: () => void;
}

import './ProcessingContent.less';

export const ProcessingContent = (props: Props) => {
    return (
        <Paper
            elevation={7}
            sx={{
                padding: '0',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                position: 'relative',
                '.MuiButton-root': {
                    textTransform: 'none',
                    ml: 1
                }
            }}
        >
            <Typography
                variant={'h6'}
                sx={{
                    padding: '16px 24px',
                    fontWeight: 400,
                    fs: '20px',
                    lh: '160%'
                }}
            >
                {props.title ?? 'Please wait...'}
            </Typography>

            {props.text && (
                <Typography
                    variant={'body2'}
                    sx={{
                        padding: '0 24px',
                    }}
                >
                    {props.text}
                </Typography>
            )}

            <div
                style={{
                    textAlign: 'right',
                    padding: '38px 8px 8px 8px',
                }}
            >
                <Button size={'medium'} color={'inherit'} variant={'text'} onClick={() => {
                    props.onCancel?.();
                    window.close();
                }}>
                    Cancel
                </Button>
                {props.link && (
                    <Button href={props.link} size={'medium'} variant={'text'} color={'primary'}  rel="noreferrer" target="_blank">
                        {props.linkText ?? 'Open in browser'}
                    </Button>
                )}
            </div>
        </Paper>
    );
};
