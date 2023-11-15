/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Button, DialogActions, DialogContent, DialogTitle, Modal, Paper, Slide } from '@mui/material';
import { PropsWithChildren, ReactNode } from 'react';
import { SxProps, Theme } from '@mui/system';

interface Props extends PropsWithChildren {
    title: string;
    closeButtonLabel?: string;
    open: boolean;
    onClose: () => void;
    actions: ReactNode;
    PaperStyle?: SxProps<Theme>;
    BackdropStyle?: SxProps<Theme>;
}

export const NoticeModal = (props: Props) => {
    return (
        <Modal
            BackdropProps={{
                sx: {
                    backdropFilter: 'blur(2px)',
                    bgcolor: 'transparent',
                    ...props.BackdropStyle,
                },
            }}
            open={props.open}
            onClose={props.onClose}
        >
            <Slide direction={'left'} in={props.open}>
                <Paper
                    elevation={3}
                    sx={{
                        width: '550px',
                        position: 'absolute',
                        right: '24px',
                        bottom: '24px',
                        boxShadow: 24,
                        ':focus-visible': {
                            outline: 'none',
                        },
                        ...props.PaperStyle,
                    }}
                >
                    <DialogTitle
                        sx={{
                            fontWeight: 600,
                        }}
                    >
                        {props.title}
                    </DialogTitle>
                    <DialogContent
                        sx={{
                            py: 0,
                        }}
                    >
                        {props.children}
                    </DialogContent>
                    <DialogActions>{props.actions}</DialogActions>
                </Paper>
            </Slide>
        </Modal>
    );
};
