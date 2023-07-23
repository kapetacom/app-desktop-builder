import React from 'react';
import './ProcessingContent.less';
import { Button, Link, Paper, Typography } from '@mui/material';

interface Props {
    text: string | null;
    linkText: string | null;
    link: string | null;
    onLinkOpen?: (url) => void | Promise<void>;
}

export const ProcessingContent = (props: Props) => {
    return (
        <Paper
            elevation={7}
            sx={{
                padding: '10px',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                position: 'relative',
                a: {
                    textDecoration: 'none',
                },
            }}
        >
            <Button
                variant={'text'}
                color={'inherit'}
                onClick={() => {
                    window.close();
                }}
                sx={{
                    position: 'absolute',
                    top: '10px',
                    width: '30px',
                    minWidth: '30px',
                    maxWidth: '30px',
                    right: '10px',
                    color: 'rgba(0,0,0,0.5)',
                    '&:hover': {
                        color: 'rgba(0,0,0,0.8)',
                    },
                }}
            >
                <i className="fas fa-times"></i>
            </Button>
            <Typography
                variant={'h6'}
                sx={{
                    margin: '20px',
                    fontWeight: 500,
                }}
            >
                Please wait...
            </Typography>

            {props.text && (
                <Typography
                    variant={'body2'}
                    sx={{
                        margin: '20px',
                    }}
                >
                    {props.text}
                </Typography>
            )}

            <div
                style={{
                    textAlign: 'right',
                    margin: '20px',
                }}
            >
                {props.link && (
                    <a href={props.link} rel="noreferrer" target="_blank">
                        <Typography variant={'body2'}>
                            {props.linkText ?? 'Continue in browser'}
                        </Typography>
                    </a>
                )}
            </div>
        </Paper>
    );
};
