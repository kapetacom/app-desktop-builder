/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { List, ListItem, ListItemButton, styled } from '@mui/material';

interface SidebarProps {
    isOpen?: boolean;
}

export const SidebarList = styled(List, {
    shouldForwardProp: (prop) => prop !== 'isOpen',
})<SidebarProps>(({ theme, isOpen }) => ({
    padding: theme.spacing[1],
    '& .MuiListItemIcon-root': {
        // alignContent: "center",
        color: theme.palette.text.primary,
        justifyContent: 'center',
        width: '40px',
        minWidth: '40px',
        paddingRight: theme.spacing(1.5),
    },
    gap: '24px',
    '& .MuiListItemButton-root': {
        padding: theme.spacing(1, isOpen ? 2 : 0.5),
    },
}));

export const SidebarListItem = styled(ListItem)(({ theme }) => ({
    padding: 0,
    borderRadius: '6px',
}));

export const SidebarListItemButton = styled(ListItemButton)<{ href?: string }>({
    borderRadius: '6px',
});
