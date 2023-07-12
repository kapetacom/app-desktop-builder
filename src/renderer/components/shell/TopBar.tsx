import React from 'react';
import {
    AppBar,
    Avatar,
    Box,
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Toolbar,
} from '@mui/material';

import { Link } from 'react-router-dom';
import {
    ChangeSet,
    MenuSection,
    UserProfile,
    KapetaNotification,
} from './types';

interface TopBarProps {
    section?: MenuSection;
    profile?: UserProfile;
    notifications?: KapetaNotification[];
    changes?: ChangeSet[];
    children?: React.ReactNode;
}

export const TopBar = (props: TopBarProps) => {
    const [profileMenuAnchorEl, setProfileMenuAchor] =
        React.useState<null | HTMLElement>(null);
    const [notificationMenuAnchor, setNotificationMenuAnchor] =
        React.useState<null | HTMLElement>(null);
    const [changesetMenuAnchor, setChangesetMenuAnchor] =
        React.useState<null | HTMLElement>(null);

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
                        onClick={(e) =>
                            setChangesetMenuAnchor(e.currentTarget as any)
                        }
                    >
                        <i className="far fa-ellipsis-h" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={(e) =>
                            setNotificationMenuAnchor(e.currentTarget as any)
                        }
                    >
                        <i className="far fa-bell" />
                    </IconButton>

                    <IconButton
                        onClick={(e) =>
                            setProfileMenuAchor(e.currentTarget as any)
                        }
                    >
                        <Avatar
                            sx={(theme) => ({
                                width: 32,
                                height: 32,
                                border: `2px solid ${theme.palette.common.white}`,
                            })}
                            src={props.profile?.avatar}
                            alt={props.profile?.name}
                        />
                    </IconButton>
                </Stack>
            </Toolbar>

            {changesetMenuAnchor ? (
                <Menu
                    anchorEl={changesetMenuAnchor}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    open={Boolean(changesetMenuAnchor)}
                    onClose={() => setChangesetMenuAnchor(null)}
                    slotProps={{
                        paper: {
                            style: {
                                maxHeight: '558px',
                                width: '300px',
                            },
                        },
                    }}
                    sx={{
                        '.MuiMenuItem-root': {
                            py: '10px',
                        },
                    }}
                >
                    <MenuItem>
                        <ListItemText
                            primary="Recent"
                            sx={{
                                '.MuiTypography-root': {
                                    fontWeight: 700,
                                    lineHeight: '160%',
                                },
                            }}
                        />
                    </MenuItem>
                    {props.changes?.length ? (
                        props.changes.map((change) => (
                            <MenuItem>
                                <ListItemIcon>
                                    <i className="far fa-bell" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={change.message}
                                    secondary={change.assetName}
                                />
                            </MenuItem>
                        ))
                    ) : (
                        <MenuItem>No changes</MenuItem>
                    )}
                </Menu>
            ) : null}

            {notificationMenuAnchor ? (
                <Menu
                    anchorEl={notificationMenuAnchor}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    open={Boolean(notificationMenuAnchor)}
                    onClose={() => setNotificationMenuAnchor(null)}
                    sx={{
                        '.MuiMenuItem-root': {
                            py: '10px',
                        },
                    }}
                    slotProps={{
                        paper: {
                            style: {
                                maxHeight: '558px',
                                width: '300px',
                            },
                        },
                    }}
                >
                    <MenuItem disableRipple>
                        <ListItemText
                            primary="Notifications"
                            sx={{
                                '.MuiTypography-root': {
                                    fontWeight: 700,
                                    lineHeight: '160%',
                                },
                            }}
                        />
                    </MenuItem>
                    {/* TODO: use a real profile link instead when we have it */}
                    {props.notifications?.length ? (
                        props.notifications.map((notification) => (
                            <MenuItem
                                component={Link}
                                to={`/${props.profile?.handle}/iam/settings/general`}
                            >
                                <ListItemIcon>
                                    <i className="fa fa-bell" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={notification.message}
                                    secondary={notification.timestamp}
                                />
                            </MenuItem>
                        ))
                    ) : (
                        <MenuItem>No notifications</MenuItem>
                    )}
                </Menu>
            ) : null}

            {profileMenuAnchorEl ? (
                <Menu
                    anchorEl={profileMenuAnchorEl}
                    open={Boolean(profileMenuAnchorEl)}
                    onClose={() => setProfileMenuAchor(null)}
                    slotProps={{
                        paper: {
                            style: {
                                width: '184px',
                            },
                        },
                    }}
                    sx={{
                        '.MuiMenuItem-root': {
                            py: '10px',
                        },
                    }}
                >
                    <MenuItem>
                        <ListItemText
                            primary={props.profile?.name}
                            secondary={props.profile?.handle}
                        />
                    </MenuItem>
                    {/* TODO: use a real profile link instead when we have it */}
                    <MenuItem
                        component={Link}
                        to={`/${props.profile?.handle}/iam/settings/general`}
                    >
                        <ListItemIcon>
                            <i className="fa fa-cog" />
                        </ListItemIcon>
                        <ListItemText primary="Settings" />
                    </MenuItem>
                    <MenuItem component="a" href="/logout">
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
