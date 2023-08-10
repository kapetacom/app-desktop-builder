import React, { useEffect, useState } from 'react';
import {
    AppBar,
    Avatar,
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

import { UserAvatar } from '@kapeta/ui-web-components';

import { Link } from 'react-router-dom';
import {
    UserProfile,
    KapetaNotification,
    StateNotificationType,
} from './types';
import {useKapetaContext} from "../../hooks/contextHook";

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

function getIconForType(type: StateNotificationType): string | undefined {
    switch (type) {
        case 'success':
            return 'fa fa-check-circle';
        case 'warning':
            return 'fas fa-exclamation-triangle';
        case 'error':
            return 'fa fa-do-not-enter';
        case 'info':
            return 'fa fa-exclamation-circle';
    }
}

function getColorForType(type: StateNotificationType): string | undefined {
    switch (type) {
        case 'success':
            return 'success.main';
        case 'warning':
            return 'warning.main';
        case 'error':
            return 'error.main';
        case 'info':
            return 'secondary.main';
    }
}

interface TopBarProps {
    notifications?: KapetaNotification[];
    children?: React.ReactNode;
}

export const TopBar = (props: TopBarProps) => {
    const [profileMenuAnchorEl, setProfileMenuAchor] =
        useState<null | HTMLElement>(null);
    const [notificationMenuAnchor, setNotificationMenuAnchor] =
        useState<null | HTMLElement>(null);

    const [notifications, setNotifications] = useState(
        props.notifications ?? []
    );

    const contexts = useKapetaContext();

    useEffect(() => {
        setNotifications((prev) => {
            let newNotifications = props.notifications ?? [];
            return newNotifications.map((newNotification) => {
                const oldNotification = prev.find(
                    (oldNotification) =>
                        oldNotification.id === newNotification.id
                );
                return {
                    ...newNotification,
                    read: oldNotification?.read ?? false,
                };
            });
        });
    }, [props.notifications]);

    const unreadNotifications =
        notifications.filter((n) => !n.read).length ?? 0;
    const notificationProgress = notifications.some((n) => {
        return n.type === 'progress' && n.progress < 100;
    });

    return (
        <AppBar
            position="static"
            sx={{
                height: '52px',
                '&>.MuiToolbar-root': {
                    height: '52px',
                    minHeight: '52px',
                },
            }}
        >
            <Toolbar disableGutters>
                {props.children}
                {/* flex to push buttons to the right  */}
                <Box flexGrow={1} />
                <Stack
                    direction="row"
                    divider={<Divider orientation="vertical" flexItem />}
                    spacing={2}
                >
                    {/* Just to trigger another divider */}
                    <span />

                    <IconButton
                        size="small"
                        sx={{
                            width: '42px',
                            height: '42px',
                            marginTop: '10px',
                            marginRight: contexts.profile ? '' : '16px !important',
                            color:
                                unreadNotifications > 0
                                    ? 'text.primary'
                                    : 'text.secondary',
                        }}
                        onClick={(e) => {
                            setNotificationMenuAnchor(e.currentTarget as any);
                            setNotifications(
                                notifications.map((n) => {
                                    return { ...n, read: true };
                                })
                            );
                        }}
                    >
                        <i className="far fa-bell" />
                        {notificationProgress && (
                            <Box
                                sx={{
                                    position: 'relative',
                                    marginTop: '1px',
                                }}
                            >
                                <CircularProgress
                                    size={40}
                                    sx={{
                                        position: 'absolute',
                                        top: '-21px',
                                        left: '-28px',
                                    }}
                                />
                            </Box>
                        )}
                    </IconButton>

                    {contexts.profile && (
                        <IconButton
                            size="small"
                            sx={{
                                width: '42px',
                                height: '42px',
                                marginRight: '16px !important',
                            }}
                            onClick={(e) =>
                                setProfileMenuAchor(e.currentTarget as any)
                            }
                        >
                            <UserAvatar size={32} name={contexts.profile.name} />
                        </IconButton>
                    )}
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
                            },
                        },
                    }}
                >
                    {props.notifications?.length ? (
                        props.notifications.map((notification, ix) => {
                            const isLast =
                                ix === props.notifications!.length - 1;
                            const sx = {
                                ...noHoverSX,
                                flexDirection: 'column',
                                div: {
                                    width: '100%',
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
                                        <MenuItem
                                            sx={sxIconItem}
                                            key={notification.id}
                                        >
                                            <ListItemIcon>
                                                <Zoom in={true} timeout={400}>
                                                    <Box
                                                        sx={{
                                                            width: '26px',
                                                            height: '26px',
                                                            lineHeight: '26px',
                                                            fontSize: '22px',
                                                            textAlign: 'center',
                                                            color: getColorForType(
                                                                'success'
                                                            ),
                                                        }}
                                                    >
                                                        <i
                                                            className={getIconForType(
                                                                'success'
                                                            )}
                                                        />
                                                    </Box>
                                                </Zoom>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={notification.message}
                                                secondary={new Date(
                                                    notification.timestamp
                                                ).toLocaleString()}
                                            />
                                        </MenuItem>
                                    );
                                }
                                return (
                                    <MenuItem sx={sx} key={notification.id}>
                                        <div className="date">
                                            {new Date(
                                                notification.timestamp
                                            ).toLocaleString()}
                                        </div>
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
                                        <div className={'progress'}>
                                            <LinearProgress
                                                variant={
                                                    notification.progress > -1
                                                        ? 'determinate'
                                                        : 'indeterminate'
                                                }
                                                value={notification.progress}
                                            />
                                        </div>
                                    </MenuItem>
                                );
                            }

                            if (notification.type === 'comment') {
                                return (
                                    <MenuItem
                                        sx={sxIconItem}
                                        key={notification.id}
                                    >
                                        <ListItemIcon>
                                            <UserAvatar
                                                size={26}
                                                name={notification.author.name}
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={notification.message}
                                            secondary={new Date(
                                                notification.timestamp
                                            ).toLocaleString()}
                                        />
                                    </MenuItem>
                                );
                            }

                            return (
                                <MenuItem sx={sxIconItem} key={notification.id}>
                                    <ListItemIcon>
                                        <Zoom in={true} timeout={400}>
                                            <Box
                                                sx={{
                                                    width: '26px',
                                                    height: '26px',
                                                    lineHeight: '26px',
                                                    fontSize: '22px',
                                                    textAlign: 'center',
                                                    color: getColorForType(
                                                        notification.type
                                                    ),
                                                }}
                                            >
                                                <i
                                                    className={getIconForType(
                                                        notification.type
                                                    )}
                                                />
                                            </Box>
                                        </Zoom>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={notification.message}
                                        secondary={new Date(
                                            notification.timestamp
                                        ).toLocaleString()}
                                    />
                                </MenuItem>
                            );
                        })
                    ) : (
                        <MenuItem key={'none'} sx={noHoverSX}>
                            No notifications
                        </MenuItem>
                    )}
                </Menu>
            ) : null}

            {profileMenuAnchorEl ? (
                <Menu
                    anchorEl={profileMenuAnchorEl}
                    sx={popoverSX}
                    open={Boolean(profileMenuAnchorEl)}
                    onClose={() => setProfileMenuAchor(null)}
                    slotProps={{
                        paper: {
                            style: {
                                width: '184px',
                            },
                        },
                    }}
                >
                    <MenuItem
                        component={Link}
                        onClick={() => setProfileMenuAchor(null)}
                        to={`/settings`}>
                        <ListItemText
                            primary={contexts.profile?.name}
                            secondary={contexts.activeContext?.identity.handle ?? contexts.profile?.handle}
                        />
                    </MenuItem>

                    <MenuItem component="a" onClick={async () => {
                        setProfileMenuAchor(null)
                        await contexts.logOut();
                    }}>
                        <ListItemIcon>
                            <i className="far fa-sign-out" />
                        </ListItemIcon>
                        <ListItemText primary="Log out" />
                    </MenuItem>
                </Menu>
            ) : null}
        </AppBar>
    );
};
