/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import { Drawer as MuiDrawer } from '@mui/material';
import { withTheme } from '../../../Theme';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
    boxSizing: 'border-box',
    width: drawerWidth,
    transition: theme.transitions.create('all', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    padding: theme.spacing(2),
    paddingTop: '48px',
});

const closedMixin = (theme: Theme): CSSObject => ({
    boxSizing: 'border-box',
    transition: theme.transitions.create('all', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
    padding: theme.spacing(1),
    paddingTop: '48px',
});

/**
 * Drawer with a new open state, collapses to a mini drawer when closed.
 * Uses overflow-x to hide the contents when closed.
 *
 * @see https://mui.com/components/drawers/#mini-variant-drawer
 */
export const MiniDrawer = withTheme(
    styled(MuiDrawer, {
        shouldForwardProp: (prop) => prop !== 'open',
    })(({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
        }),
    })),
    'dark'
);
