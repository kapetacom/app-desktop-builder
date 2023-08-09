import React from 'react';
import {Box, Button, CircularProgress, Paper, Stack, Typography} from '@mui/material';

interface Props {
    title?: string | null;
    text: string | null;
    linkText: string | null;
    link: string | null;
    onLinkOpen?: (url) => void | Promise<void>;
    onCancel?: () => void;
}

import './ProcessingContent.less';
import {isMac} from "../../utils/osUtils";

export const ProcessingContent = (props: Props) => {
    const borderRadius = isMac() ? '10px' : '0px';
    const elevation = isMac() ? 7 : 0;

    return (
        <Paper
            elevation={elevation}
            sx={{
                borderRadius,
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

            <Stack direction={'row'}
                   sx={{
                       padding: '0 24px',
                   }}>
                <Box sx={{mr:2}}>
                    <CircularProgress size={64}/>
                </Box>
                {props.text && (
                    <Typography
                        variant={'body2'}

                    >
                        {props.text}
                    </Typography>
                )}
            </Stack>

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
                    <Button href={props.link} size={'medium'} variant={'text'} color={'primary'} rel="noreferrer"
                            target="_blank">
                        {props.linkText ?? 'Open in browser'}
                    </Button>
                )}
            </div>
        </Paper>
    );
};
