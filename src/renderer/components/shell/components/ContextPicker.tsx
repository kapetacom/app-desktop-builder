import { Avatar, Divider, ListItemButton, ListItemIcon, ListItemText, Menu, Typography } from '@mui/material';
import React, { useCallback } from 'react';
import Check from '@mui/icons-material/Check';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Logout from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import { UserAvatar } from '@kapeta/ui-web-components';

import { withTheme } from 'renderer/Theme';
import { SidebarList, SidebarListItem, SidebarListItemButton } from './SidebarMenu';
import { Context } from '../types/shell';
import { useKapetaContext } from '../../../hooks/contextHook';

interface ContextPickerProps {
    contexts: Context[];
    userHandle: string;
    onContextChange?: (context: Context) => void;
    onOpen?: () => void;
}

const toInitials = (name: string) => {
    if (!name) {
        return '';
    }

    if (name.length < 3) {
        return name;
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) {
        return parts[0].substring(0, 2).toUpperCase();
    }

    const firstPart = parts[0];
    const lastPart = parts[parts.length - 1];
    return (firstPart[0] + lastPart[0]).toUpperCase();
};

const LightMenu = withTheme(Menu, 'light');

export const ContextPicker = (props: ContextPickerProps) => {
    const kapetaContext = useKapetaContext();
    const currentContext = props.contexts?.find((context) => context.current);
    const userContext = props.contexts?.find((context) => context.handle === props.userHandle);
    const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
    const close = useCallback(() => setMenuAnchor(null), [setMenuAnchor]);

    return (
        <>
            <SidebarList
                sx={{
                    pt: 0,
                    '& .MuiAvatar-root': {
                        width: 24,
                        height: 24,
                        fontSize: 12,
                    },
                }}
            >
                <SidebarListItem>
                    <SidebarListItemButton
                        onClick={(e) => {
                            setMenuAnchor(e.currentTarget);
                            props.onOpen && props.onOpen();
                        }}
                    >
                        <ListItemIcon>
                            <UserAvatar name={currentContext?.name} size={24} />
                        </ListItemIcon>
                        <Typography variant="body1" noWrap flexGrow={1}>
                            {currentContext ? currentContext.name : 'No context'}
                        </Typography>
                        <ListItemIcon sx={{ '&.MuiListItemIcon-root': { width: '16px', minWidth: 0 } }}>
                            <ExpandMore />
                        </ListItemIcon>
                    </SidebarListItemButton>
                </SidebarListItem>
            </SidebarList>

            <LightMenu
                open={!!menuAnchor}
                anchorEl={menuAnchor}
                onClose={() => setMenuAnchor(null)}
                slotProps={{
                    paper: {
                        sx: {
                            px: 2,
                            py: 1,
                            width: 265,
                        },
                    },
                }}
                sx={{
                    '& .MuiAvatar-root': {
                        width: 24,
                        height: 24,
                        fontSize: 12,
                    },
                    // Needed if we nest a button inside menuitem
                    // '& .MuiListItemButton-root': {
                    //     '&:hover': {
                    //         backgroundColor: 'transparent',
                    //     },
                    // },
                }}
            >
                <ListItemButton
                    onClick={() => {
                        props.onContextChange && props.onContextChange(userContext!);
                        close();
                    }}
                >
                    <ListItemIcon>
                        <UserAvatar name={userContext?.name} size={24} />
                    </ListItemIcon>

                    <Typography variant="body1" noWrap fontWeight={500} flexGrow={1}>
                        {userContext ? userContext.name : 'No context'}
                    </Typography>
                    {userContext?.current ? <Check sx={{ pl: 1 }} /> : null}
                </ListItemButton>

                <ListItemButton href={`/settings`} onClick={close}>
                    <ListItemIcon />
                    <ListItemText primary="Settings" />
                </ListItemButton>

                <Divider component="li" />
                <li>
                    <Typography sx={{ mt: 0.5, ml: 2 }} color="text.secondary" display="block" variant="caption">
                        Switch context
                    </Typography>
                </li>

                {props.contexts
                    ?.filter((context) => context !== userContext)
                    .map((context, i) => (
                        <ListItemButton
                            key={context.handle || i}
                            onClick={() => {
                                props.onContextChange && props.onContextChange(context);
                                close();
                            }}
                        >
                            <ListItemIcon>
                                <UserAvatar name={context.name} size={24} />
                            </ListItemIcon>
                            <Typography variant="body1" noWrap fontWeight={500} flexGrow={1}>
                                {context.name}
                            </Typography>
                            {context.current ? <Check sx={{ pl: 1 }} /> : null}
                        </ListItemButton>
                    ))}

                <ListItemButton
                    onClick={() => {
                        close();
                        kapetaContext.tabs.open('/settings/organizations', { navigate: true });
                    }}
                >
                    <ListItemIcon>
                        <Avatar
                            variant="rounded"
                            sx={{ color: 'inherit', backgroundColor: 'transparent', border: '1px solid' }}
                        >
                            <AddIcon />
                        </Avatar>
                    </ListItemIcon>
                    <ListItemText primary="Manage organizations" />
                </ListItemButton>

                <Divider component="li" sx={{ my: 1 }} />

                <ListItemButton
                    onClick={async () => {
                        close();
                        await kapetaContext.logOut();
                    }}
                >
                    <ListItemIcon>
                        <Logout />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                    <ChevronRight />
                </ListItemButton>
            </LightMenu>
        </>
    );
};
