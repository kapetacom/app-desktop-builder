/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useState } from 'react';

import { ListItemIcon, ListItemText, styled, Divider, IconButton, Box, Stack, Button, Badge } from '@mui/material';
import { useMatches } from 'react-router-dom';
import './MainLayout.less';
import { Context, MenuSection } from './types/shell';
import { MiniDrawer } from './components/MiniDrawer';
import { ContextPicker } from './components/ContextPicker';
import { KapetaIcon } from './components/KapetaIcon';
import { Logo } from './components/KapetaLogo';
import { SidebarList, SidebarListItem, SidebarListItemButton } from './components/SidebarMenu';
import { Identity, MemberIdentity } from '@kapeta/ui-web-types';
import { BlockhubShell } from './components/BlockhubShell';
import { useKapetaContext } from '../../hooks/contextHook';
import BlockHubIcon from './components/icons/large/BlockHubIcon.svg';
import IntercomIcon from './components/icons/Intercom.svg';
import { KindIcon } from '@kapeta/ui-web-components';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface ConsoleLocation {
    pathname: string;
}

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'stretch',
    borderBottom: `1px solid ${theme.palette.divider}`,
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

interface Props {
    menu: MenuSection[];
    location: ConsoleLocation;
    context?: {
        identity?: Identity;
        contexts?: Context[];
        activeContext?: MemberIdentity;
        setActiveContext: (ctx: Context) => void;
        refreshContexts: () => void;
    };
    children?: any;
    topBar?: React.ReactNode;
}

export const MainLayout = (props: Props) => {
    const kapetaContext = useKapetaContext();

    const [drawerIsOpen, setDrawerIsOpen] = useState(true);
    const toggleDrawer = () => setDrawerIsOpen(!drawerIsOpen);

    const matches = useMatches();

    return (
        <>
            <section className="main-layout">
                <MiniDrawer variant="permanent" open={drawerIsOpen}>
                    <ContextPicker
                        contexts={props.context?.contexts || []}
                        userHandle={props.context?.identity?.handle || ''}
                        onContextChange={props.context?.setActiveContext}
                        onOpen={() => {
                            props.context?.refreshContexts();
                        }}
                    />
                    <SidebarList>
                        {props.menu
                            .filter((item) => !item.hidden)
                            .map((item) => {
                                const linkPath = item.path;

                                const current = !!matches.find((m) => m.pathname === linkPath);
                                let icon = item.error ? (
                                    <i className="fa fa-exclamation-triangle" />
                                ) : (
                                    item.icon || <KindIcon kind="core/block-type" />
                                );
                                icon = item.loading ? <i className="fa fa-circle-notch fa-spin" /> : icon;

                                return (
                                    <SidebarListItem key={`${linkPath}-item`}>
                                        <SidebarListItemButton
                                            href={item.path}
                                            selected={current}
                                            data-kap-id={item['data-kap-id']}
                                        >
                                            <ListItemIcon>{icon}</ListItemIcon>
                                            <ListItemText primary={item.name} />
                                        </SidebarListItemButton>
                                    </SidebarListItem>
                                );
                            })}

                        <Divider sx={{ my: 1 }} />
                        <SidebarListItem>
                            <SidebarListItemButton
                                onClick={() => kapetaContext.blockHub.open()}
                                data-kap-id="app-left-menu-block-hub-button"
                            >
                                <ListItemIcon>
                                    <BlockHubIcon width={24} height={24} />
                                </ListItemIcon>
                                <ListItemText primary="Block Hub" />
                            </SidebarListItemButton>
                        </SidebarListItem>
                    </SidebarList>
                    <Box
                        sx={{
                            mt: 'auto',
                            height: '96px',
                            ml: drawerIsOpen ? '0px' : '6px',
                            transition: (theme) =>
                                theme.transitions.create(
                                    'margin-left',
                                    drawerIsOpen
                                        ? {
                                              easing: theme.transitions.easing.sharp,
                                              duration: theme.transitions.duration.enteringScreen,
                                          }
                                        : {
                                              easing: theme.transitions.easing.sharp,
                                              duration: theme.transitions.duration.leavingScreen,
                                          }
                                ),
                        }}
                    >
                        <Box
                            sx={{
                                width: '96px',
                                transform: 'rotate(-90deg) translateX(-100%)',
                                transformOrigin: 'top left',
                            }}
                        >
                            <Button
                                variant="outlined"
                                color="inherit"
                                endIcon={<HelpOutlineIcon fontSize="inherit" />}
                                data-kap-id="app-left-menu-beta-button"
                            >
                                BETA
                            </Button>
                        </Box>
                    </Box>
                    <IconButton
                        sx={{
                            position: 'relative',
                            display: 'block',
                            py: 2,
                            width: '100%',
                            '&:hover': { backgroundColor: 'inherit' },
                            mt: 'auto',
                            color: 'white',
                        }}
                        onClick={toggleDrawer}
                    >
                        <Badge
                            color="secondary"
                            invisible={
                                !window.KapetaDesktop || !window.KapetaDesktop.urls.app.includes('.staging.kapeta.com')
                            }
                            sx={{
                                '.MuiBadge-badge': {
                                    color: 'inherit',
                                    top: '-5px',
                                    right: '-5px',
                                },
                            }}
                            badgeContent="Staging"
                        >
                            {drawerIsOpen ? <Logo width={122} /> : <KapetaIcon />}
                        </Badge>
                    </IconButton>
                    <Button
                        color="info"
                        sx={{
                            '&:hover': { backgroundColor: 'inherit' },
                            m: '0 auto',
                            fontSize: 'inherit',
                            border: '1px solid',
                            maxWidth: '100%',
                            minWidth: 'auto',
                            width: drawerIsOpen ? '140px' : 'auto',
                        }}
                        onClick={() => {
                            window.Intercom?.('show');
                        }}
                    >
                        <IntercomIcon />
                        {drawerIsOpen ? <>&nbsp;Get Help</> : ''}
                    </Button>
                </MiniDrawer>

                <section style={{ flexGrow: 1 }}>
                    <main>{props.children}</main>
                </section>
            </section>

            <BlockhubShell handle={props.context?.activeContext?.identity.handle} />
        </>
    );
};
