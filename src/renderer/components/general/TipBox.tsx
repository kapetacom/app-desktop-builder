/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Box, Button, Stack, Typography } from '@mui/material';
import { useLocalStorage } from 'react-use';
import { useCallback } from 'react';
import { NoticeModal } from './NoticeModal';

interface Props {
    id: string;
    description: string;
    title: string;
    closeButtonLabel?: string;
    icon: React.ReactNode;
}

export const TipBox = (props: Props) => {
    const [open, setOpen] = useLocalStorage<boolean>(props.id, true);

    const onClose = useCallback(() => setOpen(false), []);

    return (
        <NoticeModal
            open={Boolean(open)}
            onClose={onClose}
            title={props.title}
            actions={
                <Button color={'primary'} onClick={onClose}>
                    Dismiss
                </Button>
            }
        >
            <Stack direction={'row'} alignItems={'center'}>
                <Box
                    sx={{
                        py: 1,
                        px: 0.5,
                        svg: {
                            width: '100%',
                            height: '100%',
                        },
                    }}
                >
                    {props.icon}
                </Box>
                <Typography>{props.description}</Typography>
            </Stack>
        </NoticeModal>
    );
};
