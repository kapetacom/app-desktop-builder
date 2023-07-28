import React from 'react';
import { Avatar, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import { MemberIdentity } from '@kapeta/ui-web-types';
import {
    SidebarList,
    SidebarListItem,
    SidebarListItemButton,
} from './SidebarMenu';

interface ContextPickerProps {
    contexts?: MemberIdentity[];
    onChangeContext: (ctx: MemberIdentity) => void;
    handle?: MemberIdentity;
    isOpen?: boolean;
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

export const ContextPicker = (props: ContextPickerProps) => {
    const theme = useTheme();

    return (
        <SidebarList
            sx={{
                display: 'flex',
                flexGrow: 1,
                flexDirection: 'column',
                justifyContent: 'flex-end',
            }}
            isOpen={props.isOpen}
        >
            {props.contexts?.map((context) => (
                <SidebarListItem key={context.identity.handle}>
                    <SidebarListItemButton
                        onClick={() => props.onChangeContext(context)}
                    >
                        <ListItemIcon>
                            <Avatar
                                variant="rounded"
                                sx={
                                    context === props.handle
                                        ? {
                                              backgroundColor:
                                                  theme.palette.info.light,
                                              color: theme.palette.text.primary,
                                          }
                                        : {
                                              backgroundColor:
                                                  theme.palette.grey.A400,
                                              color: theme.palette.text
                                                  .secondary,
                                          }
                                }
                            >
                                {/* @ts-ignore */}
                                {context.avatar ||
                                    toInitials(context.identity.name)}
                            </Avatar>
                        </ListItemIcon>
                        <ListItemText>{context.identity.name}</ListItemText>
                    </SidebarListItemButton>
                </SidebarListItem>
            ))}
            <SidebarListItem>
                <SidebarListItemButton
                    // Add new should trigger login?
                    href="/iam/settings/general"
                    disabled={!props.handle}
                >
                    <ListItemIcon>
                        <Avatar
                            variant="rounded"
                            sx={{
                                boxSizing: 'border-box',
                                backgroundColor: 'transparent',
                                border: `1px solid ${theme.palette.text.primary}`,
                                color: theme.palette.text.primary,
                            }}
                        >
                            +
                        </Avatar>
                    </ListItemIcon>
                    <ListItemText>Add new</ListItemText>
                </SidebarListItemButton>
            </SidebarListItem>
        </SidebarList>
    );
};
