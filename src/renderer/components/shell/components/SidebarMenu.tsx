import { List, ListItem, ListItemButton, Theme, styled } from '@mui/material';

interface SidebarProps {
    isOpen?: boolean;
}

export const SidebarList = styled(List, {
    shouldForwardProp: (prop) => prop !== 'isOpen',
})<SidebarProps>(({ theme, isOpen }) => ({
    padding: theme.spacing[1],
    '& .MuiListItemIcon-root': {
        // alignContent: "center",
        justifyContent: 'center',
        width: '40px',
        minWidth: '40px',
        paddingRight: theme.spacing(1.5),
    },
    gap: '24px',
    '& .MuiListItemButton-root': {
        padding: theme.spacing(1, isOpen ? 2 : 1.5),
    },
}));

export const SidebarListItem = styled(ListItem)(({ theme }) => ({
    padding: 0,
}));

export const SidebarListItemButton = styled(ListItemButton)<{ href?: string }>(
    {}
);
