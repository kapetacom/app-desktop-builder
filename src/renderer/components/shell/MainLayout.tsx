import React, { useState } from 'react';

import {
    ListItemIcon,
    ListItemText,
    styled,
    Divider,
    IconButton,
} from '@mui/material';
import { useMatches } from 'react-router-dom';
import './MainLayout.less';
import { MenuSection } from './types/shell';
import { MiniDrawer } from './components/MiniDrawer';
import { ContextPicker } from './components/ContextPicker';
import { KapetaIcon } from './components/KapetaIcon';
import { Logo } from './components/KapetaLogo';
import {
    SidebarList,
    SidebarListItem,
    SidebarListItemButton,
} from './components/SidebarMenu';
import { CustomIcon } from './components/CustomIcon';
import { MemberIdentity } from '@kapeta/ui-web-types';
import { BlockhubShell } from './components/BlockhubShell';
import { useKapetaContext } from '../../hooks/contextHook';

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
        contexts?: MemberIdentity[];
        activeContext?: MemberIdentity;
        setActiveContext: (ctx: MemberIdentity) => void;
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
                    <DrawerHeader>
                        <IconButton
                            sx={{
                                display: 'block',
                                padding: 0,
                                width: '100%',
                                '&:hover': { backgroundColor: 'inherit' },
                            }}
                            onClick={toggleDrawer}
                        >
                            {drawerIsOpen ? (
                                <Logo height={28} width={122} />
                            ) : (
                                <KapetaIcon />
                            )}
                        </IconButton>
                    </DrawerHeader>
                    <SidebarList>
                        {props.menu
                            .filter((item) => !item.hidden)
                            .map((item) => {
                                const linkPath = item.path;

                                const current = !!matches.find(
                                    (m) => m.pathname === linkPath
                                );
                                let icon = item.error ? (
                                    <i className="fa fa-exclamation-triangle" />
                                ) : (
                                    item.icon || <CustomIcon icon="Block" />
                                );
                                icon = item.loading ? (
                                    <i className="fa fa-circle-notch fa-spin" />
                                ) : (
                                    icon
                                );

                                return (
                                    <SidebarListItem key={`${linkPath}-item`}>
                                        <SidebarListItemButton
                                            href={item.path}
                                            selected={current}
                                        >
                                            <ListItemIcon>{icon}</ListItemIcon>
                                            <ListItemText primary={item.name} />
                                        </SidebarListItemButton>
                                    </SidebarListItem>
                                );
                            })}

                        <Divider />
                        <SidebarListItem>
                            <SidebarListItemButton
                                onClick={() => kapetaContext.blockHub.open()}
                            >
                                <ListItemIcon>
                                    <CustomIcon icon="Block" />
                                </ListItemIcon>
                                <ListItemText primary={'Block Hub'} />
                            </SidebarListItemButton>
                        </SidebarListItem>
                    </SidebarList>
                    <ContextPicker
                        isOpen={drawerIsOpen}
                        contexts={props.context?.contexts}
                        handle={props.context?.activeContext}
                        onChangeContext={(ctx) =>
                            props.context?.setActiveContext(ctx)
                        }
                    />
                </MiniDrawer>

                <section style={{ flexGrow: 1 }}>
                    {props.topBar}
                    <main>{props.children}</main>
                </section>
            </section>

            <BlockhubShell
                handle={props.context?.activeContext?.identity.handle}
            />
        </>
    );
};
