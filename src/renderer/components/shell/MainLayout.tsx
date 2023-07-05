import React, { useState } from 'react';

import './MainLayout.less';
import { toClass } from '@kapeta/ui-web-utils';
import { Link } from 'react-router-dom';
import { Context, MenuSection } from '../views/console/types';
import { FragmentMenuItem } from '@kapeta/web-microfrontend/browser';
import {
    Drawer as MuiDrawer,
    ListItemIcon,
    ListItemText,
    styled,
    Divider,
    Button,
    IconButton,
    Collapse,
    AppBar,
    Toolbar,
    Box,
    Avatar,
    Typography,
    Stack,
    MenuItem,
} from '@mui/material';
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
import { TopBar } from './components/TopBar';

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
    contexts?: Context[];
    manageOrganizationUrl?: string;
    handle: string;
    children?: any;
    topBar?: React.ReactNode;
}

export const MainLayout = (props: Props) => {
    const currentLocation = props.location;

    const normalizedPath = currentLocation.pathname.replace(/\/+$/, '');
    const [isOpen, setIsOpen] = useState(true);
    const toggle = () => setIsOpen(!isOpen);

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
                        .map((item, ix) => {
                            const path = `/${props.handle}/${item.id}`;
                            const linkPath = `${path}${
                                item.path ? item.path : ''
                            }`.replace(/\/+$/, '');
                            const open = normalizedPath.startsWith(path);
                            let current = normalizedPath === linkPath;
                            const hasSubMenu =
                                item.submenu && item.submenu.length > 0;
                            if (!hasSubMenu && open) {
                                current = true;
                            }
                            const toggleIcon = open ? (
                                <i className="fa fa-chevron-up" />
                            ) : (
                                <i className="fa fa-chevron-down" />
                            );

                            return [
                                <SidebarListItem key={`${linkPath}-item`}>
                                    <SidebarListItemButton
                                        href={linkPath}
                                        selected={current}
                                    >
                                        <ListItemIcon>
                                            {item.loading ? (
                                                <i className="fa fa-circle-notch fa-spin" />
                                            ) : item.error ? (
                                                <i className="fa fa-exclamation-triangle" />
                                            ) : (
                                                <CustomIcon icon={'Block'} />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText primary={item.name} />
                                        {hasSubMenu ? toggleIcon : null}
                                    </SidebarListItemButton>
                                </SidebarListItem>,
                                hasSubMenu ? (
                                    <Collapse
                                        in={open}
                                        timeout="auto"
                                        unmountOnExit
                                        key={`${linkPath}-collapse`}
                                    >
                                        <SidebarList disablePadding>
                                            {item.submenu?.map(
                                                (subItem, six) => {
                                                    const subPath = `${path}${subItem.url}`;
                                                    return (
                                                        <SidebarListItem
                                                            key={subPath + six}
                                                        >
                                                            <SidebarListItemButton
                                                                selected={
                                                                    normalizedPath ===
                                                                    subPath.replace(
                                                                        /\/+$/,
                                                                        ''
                                                                    )
                                                                }
                                                                href={subPath}
                                                            >
                                                                <ListItemIcon />
                                                                <ListItemText
                                                                    primary={
                                                                        subItem.name
                                                                    }
                                                                />
                                                            </SidebarListItemButton>
                                                        </SidebarListItem>
                                                    );
                                                }
                                            )}
                                        </SidebarList>
                                    </Collapse>
                                ) : null,
                            ];
                        })}

                    <Divider />
                </SidebarList>
                <ContextPicker
                    isOpen={isOpen}
                    contexts={props.contexts}
                    handle={props.handle}
                />
            </MiniDrawer>

            <section style={{ flexGrow: 1 }}>
                {props.topBar}
                <main>{props.children}</main>
            </section>
        </section>
    );
};
