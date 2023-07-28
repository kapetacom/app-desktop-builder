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
import { Context, MenuSection } from './types/shell';
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
    const [isOpen, setIsOpen] = useState(true);
    const toggle = () => setIsOpen(!isOpen);

    const matches = useMatches();

    return (
        <section className="main-layout">
            <MiniDrawer variant="permanent" open={isOpen}>
                <DrawerHeader>
                    <IconButton
                        sx={{
                            display: 'block',
                            padding: 0,
                            width: '100%',
                            '&:hover': { backgroundColor: 'inherit' },
                        }}
                        onClick={toggle}
                    >
                        {isOpen ? (
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
                </SidebarList>
                <ContextPicker
                    isOpen={isOpen}
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
    );
};
