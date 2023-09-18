import React, { useEffect, useState } from 'react';
import {
    AppBar,
    Box,
    Divider,
    IconButton,
    LinearProgress,
    CircularProgress,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Toolbar,
    Typography,
    Zoom,
} from '@mui/material';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { UserAvatar } from '@kapeta/ui-web-components';
import { KapetaNotification, StateNotificationType } from './types';
import { withTheme } from '../../Theme';

const noHoverSX = {
    cursor: 'default',
    '&:hover': {
        backgroundColor: 'transparent',
    },
};

const popoverSX = {
    marginTop: '5px',
    '.MuiPaper-root': {
        borderTopLeftRadius: '0',
        borderTopRightRadius: '0',
    },
};

function getIconForType(notificationType: StateNotificationType): string | undefined {
    switch (notificationType) {
        case 'success':
            return 'fa fa-check-circle';
        case 'warning':
            return 'fas fa-exclamation-triangle';
        case 'error':
            return 'fa fa-do-not-enter';
        case 'info':
            return 'fa fa-exclamation-circle';
        default: {
            notificationType satisfies never;
        }
    }
    return undefined;
}

function getColorForType(notificationType: StateNotificationType): string | undefined {
    switch (notificationType) {
        case 'success':
            return 'success.main';
        case 'warning':
            return 'warning.main';
        case 'error':
            return 'error.main';
        case 'info':
            return 'secondary.main';
        default: {
            notificationType satisfies never;
        }
    }
    return undefined;
}

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
                        '-webkit-app-region': 'drag',
                        height: '100%',
                    }}
                />
                <Stack
                    direction="row"
                    divider={<Divider orientation="vertical" flexItem />}
                    spacing={1}
                    marginRight={1}
                    sx={{
                        '& .MuiSvgIcon-root': {
                            fontSize: '16px',
                        },
                    }}
                >
                    <IconButton
                        size="small"
                        sx={{ width: '40px', height: '40px' }}
                        data-kap-id="app-top-bar-help-button"
                    >
                        <QuestionMarkIcon />
                    </IconButton>

                    <IconButton
                        size="small"
                        sx={{
                            position: 'relative',
                            width: '40px',
                            height: '40px',
                            color: hasUnreadNotifications ? 'text.primary' : 'text.secondary',
                        }}
                        onClick={(e) => {
                            setNotificationMenuAnchor(e.currentTarget as any);
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

            {notificationMenuAnchor ? (
                <Menu
                    anchorEl={notificationMenuAnchor}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    sx={popoverSX}
                    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    open={Boolean(notificationMenuAnchor)}
                    onClose={() => setNotificationMenuAnchor(null)}
                    slotProps={{
                        paper: {
                            style: {
                                maxHeight: '558px',
                                width: '450px',
                                borderRadius: '4px',
                            },
                        },
                    }}
                >
                    {props.notifications?.length ? (
                        props.notifications.map((notification, ix) => {
                            const isLast = ix === props.notifications!.length - 1;
                            const sx = {
                                ...noHoverSX,
                                flexDirection: 'column',
                                div: {
                                    width: '100%',
                                },
                                // Make long notifications wrap
                                '.MuiListItemText-root': {
                                    whiteSpace: 'normal',
                                },
                                '.MuiTypography-body2': {
                                    fontSize: '12px',
                                    color: 'text.secondary',
                                },
                                '.MuiTypography-body1': {
                                    fontSize: '14px',
                                },
                                '.date': {
                                    fontSize: '12px',
                                    color: 'text.secondary',
                                    textAlign: 'left',
                                },
                                '.message': {
                                    fontSize: '14px',
                                    color: 'text.primary',
                                },
                                '.progress': {
                                    width: '100%',
                                    height: '4px',
                                },
                            };

                            if (!isLast) {
                                Object.assign(sx, {
                                    borderBottomColor: 'text.secondary',
                                    borderBottomWidth: '1px',
                                    borderBottomStyle: 'solid',
                                });
                            }

                            const sxIconItem = {
                                ...sx,
                                flexDirection: 'row',
                                div: { width: 'auto' },
                            };

                            if (notification.type === 'progress') {
                                if (notification.progress === 100) {
                                    return (
                                        <MenuItem sx={sxIconItem} key={notification.id}>
                                            <ListItemIcon>
                                                <Zoom in timeout={400}>
                                                    <Box
                                                        sx={{
                                                            width: '26px',
                                                            height: '26px',
                                                            lineHeight: '26px',
                                                            fontSize: '22px',
                                                            textAlign: 'center',
                                                            color: getColorForType('success'),
                                                        }}
                                                    >
                                                        <i className={getIconForType('success')} />
                                                    </Box>
                                                </Zoom>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={notification.message}
                                                secondary={new Date(notification.timestamp).toLocaleString()}
                                            />
                                        </MenuItem>
                                    );
                                }
                                return (
                                    <MenuItem sx={sx} key={notification.id}>
                                        <div className="date">{new Date(notification.timestamp).toLocaleString()}</div>
                                        <div className="message">
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    lineHeight: '32px',
                                                }}
                                            >
                                                {notification.message}
                                            </Typography>
                                        </div>
                                        <div className="progress">
                                            <LinearProgress
                                                variant={notification.progress > -1 ? 'determinate' : 'indeterminate'}
                                                value={notification.progress}
                                            />
                                        </div>
                                    </MenuItem>
                                );
                            }

                            if (notification.type === 'comment') {
                                return (
                                    <MenuItem sx={sxIconItem} key={notification.id}>
                                        <ListItemIcon>
                                            <UserAvatar size={26} name={notification.author.name} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={notification.message}
                                            secondary={new Date(notification.timestamp).toLocaleString()}
                                        />
                                    </MenuItem>
                                );
                            }

                            return (
                                <MenuItem sx={sxIconItem} key={notification.id}>
                                    <ListItemIcon>
                                        <Zoom in timeout={400}>
                                            <Box
                                                sx={{
                                                    width: '26px',
                                                    height: '26px',
                                                    lineHeight: '26px',
                                                    fontSize: '22px',
                                                    textAlign: 'center',
                                                    color: getColorForType(notification.type),
                                                }}
                                            >
                                                <i className={getIconForType(notification.type)} />
                                            </Box>
                                        </Zoom>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={notification.message}
                                        secondary={new Date(notification.timestamp).toLocaleString()}
                                    />
                                </MenuItem>
                            );
                        })
                    ) : (
                        <MenuItem key="none" sx={noHoverSX}>
                            No notifications
                        </MenuItem>
                    )}
                </Menu>
            ) : null}
        </AppBar>
    );
}, 'dark');
