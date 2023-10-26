import React, { useEffect, useState } from 'react';
import { AppBar, Box, Divider, IconButton, CircularProgress, Stack, Toolbar } from '@mui/material';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { KapetaNotification, TOP_BAR_ICON_BUTTON_STYLE } from './types';
import { withTheme } from '../../Theme';
import { NotificationsDropdown } from './NotificationsDropdown';

interface TopBarProps {
    notifications?: KapetaNotification[];
    children?: React.ReactNode;
}

export const TopBar = withTheme((props: TopBarProps) => {
    const [notificationMenuAnchor, setNotificationMenuAnchor] = useState<null | HTMLElement>(null);

    const [notifications, setNotifications] = useState(props.notifications ?? []);

    useEffect(() => {
        setNotifications((prevNotifications) => {
            let newNotifications = props.notifications ?? [];
            return newNotifications.map((newNotification) => {
                const oldNotification = prevNotifications.find(
                    (prevNotification) => prevNotification.id === newNotification.id
                );
                return {
                    ...newNotification,
                    read: oldNotification?.read ?? false,
                };
            });
        });
    }, [props.notifications]);

    const unreadNotifications = notifications.filter((n) => !n.read).length ?? 0;
    const hasUnreadNotifications = unreadNotifications > 0;
    const notificationProgress = notifications.some((n) => {
        return n.type === 'progress' && n.progress < 100;
    });

    return (
        <AppBar
            position="fixed"
            sx={{
                // Make it be on top of the sidebar, and remove the gradient image
                zIndex: 1300,
                backgroundImage: 'none',
                height: '40px',
                '&>.MuiToolbar-root': {
                    height: '40px',
                    minHeight: '40px',
                },
            }}
        >
            <Toolbar disableGutters>
                {props.children}
                {/* Make the empty space in the tabbar draggable to move electron window around */}
                <Box
                    flexGrow={1}
                    sx={{
                        height: '100%',
                    }}
                    className="allow-drag-app"
                />
                <Stack
                    direction="row"
                    divider={<Divider orientation="vertical" flexItem />}
                    spacing={1}
                    marginRight={1}
                    height="100%"
                    alignItems="center"
                >
                    <IconButton size="small" sx={TOP_BAR_ICON_BUTTON_STYLE} data-kap-id="app-top-bar-help-button">
                        <QuestionMarkIcon />
                    </IconButton>

                    <IconButton
                        size="small"
                        sx={{
                            ...TOP_BAR_ICON_BUTTON_STYLE,
                            position: 'relative',
                            color: hasUnreadNotifications ? 'text.primary' : 'text.secondary',
                        }}
                        onClick={(e) => {
                            setNotificationMenuAnchor(e.currentTarget);
                            setNotifications(
                                notifications.map((n) => {
                                    return { ...n, read: true };
                                })
                            );
                        }}
                        data-kap-id="app-top-bar-notifications-button"
                    >
                        {hasUnreadNotifications ? (
                            <NotificationsActiveIcon color="inherit" />
                        ) : (
                            <NotificationsNoneIcon color="inherit" />
                        )}
                        {notificationProgress && (
                            <CircularProgress size={36} sx={{ position: 'absolute' }} color="inherit" />
                        )}
                    </IconButton>
                </Stack>
            </Toolbar>

            <NotificationsDropdown
                anchorEl={notificationMenuAnchor}
                notifications={props.notifications}
                onClose={() => setNotificationMenuAnchor(null)}
            />
        </AppBar>
    );
}, 'dark');
