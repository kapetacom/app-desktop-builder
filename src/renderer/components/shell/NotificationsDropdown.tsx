/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { ReactNode } from 'react';
import {
    Box,
    CircularProgress,
    CircularProgressProps,
    circularProgressClasses,
    ListItemIcon,
    ListItemText,
    List,
    ListItem,
    Popper,
    ClickAwayListener,
    Paper,
    Grow,
} from '@mui/material';
import { KapetaNotification, StateNotificationType } from './types';
import { withTheme } from '../../Theme';
import { UserAvatar, createVerticalScrollShadow } from '@kapeta/ui-web-components';
import ExclamationCircleIcon from '@mui/icons-material/Error';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export interface NotificationsDropdownProps {
    anchorEl?: HTMLElement | null;
    notifications?: KapetaNotification[];
    onClose?: () => void;
}

function NotificationCircularProgress(props: CircularProgressProps) {
    const { sx, variant, ...rest } = props;
    return (
        <Box sx={{ position: 'relative' }}>
            <CircularProgress
                {...rest}
                variant="determinate"
                sx={{
                    ...sx,
                    color: '#e2e2e2',
                }}
                value={100}
            />
            <CircularProgress
                variant={variant}
                sx={{
                    ...sx,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    [`& .${circularProgressClasses.circle}`]: {
                        strokeLinecap: 'round',
                    },
                }}
                {...rest}
            />
        </Box>
    );
}

function getIconForStateNotification(notificationType: StateNotificationType): React.ReactNode | null {
    switch (notificationType) {
        case 'success':
            return <CheckCircleIcon fontSize="medium" color="success" />;
        case 'warning':
            return <ExclamationCircleIcon fontSize="medium" color="warning" />;
        case 'error':
            return <RemoveCircleIcon fontSize="medium" color="error" />;
        case 'info':
            return <ExclamationCircleIcon fontSize="medium" color="secondary" />;
        default:
            notificationType satisfies never;
    }
    return null;
}

const NotificationsList = ({ notifications = [] }: { notifications?: KapetaNotification[] }) => {
    return (
        <List
            sx={{
                maxHeight: '550px',
                width: '450px',
                ...createVerticalScrollShadow(0.1),
            }}
        >
            {notifications?.length ? (
                <>
                    {notifications.map((notification, ix) => (
                        <NotificationItem key={ix} notification={notification} />
                    ))}
                </>
            ) : (
                <ListItem>
                    <ListItemText>No notifications</ListItemText>
                </ListItem>
            )}
        </List>
    );
};

const NotificationItem = (props: { notification: KapetaNotification }) => {
    const { notification } = props;

    let icon: ReactNode;
    switch (notification.type) {
        case 'progress': {
            icon =
                notification.progress === 100 ? (
                    getIconForStateNotification('success')
                ) : (
                    <NotificationCircularProgress
                        size={20}
                        value={notification.progress}
                        color="inherit"
                        variant={notification.progress > -1 ? 'determinate' : 'indeterminate'}
                        sx={{ m: '2px' }}
                    />
                );
            break;
        }

        case 'comment':
            icon = (
                <Box sx={{ m: '2px' }}>
                    <UserAvatar size={20} name={notification.author.name} />
                </Box>
            );
            break;

        case 'success':
        case 'error':
        case 'warning':
        case 'info':
            icon = getIconForStateNotification(notification.type);
            break;

        default:
            notification satisfies never;
            return null;
    }

    return (
        <ListItem sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
            <ListItemText
                primary={notification.message}
                secondary={new Date(notification.timestamp).toLocaleString()}
            />
        </ListItem>
    );
};

export const NotificationsDropdown = withTheme((props: NotificationsDropdownProps) => {
    const { anchorEl, notifications, onClose } = props;

    const isOpen = Boolean(anchorEl);

    return (
        <Popper
            anchorEl={anchorEl}
            open={isOpen}
            placement="bottom-end"
            modifiers={[
                {
                    name: 'offset',
                    enabled: true,
                    options: { offset: [0, 14] },
                },
            ]}
            transition
            style={{
                zIndex: 1500,
            }}
        >
            {({ TransitionProps }) => (
                <Grow
                    {...TransitionProps}
                    timeout={200}
                    style={{ transformOrigin: 'top right', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                >
                    <Paper
                        sx={{
                            borderRadius: 1,
                            overflow: 'hidden',
                        }}
                        elevation={8}
                    >
                        <ClickAwayListener onClickAway={() => onClose?.()}>
                            <Box>
                                <NotificationsList notifications={notifications} />
                            </Box>
                        </ClickAwayListener>
                    </Paper>
                </Grow>
            )}
        </Popper>
    );
}, 'light');
