import { Outlet, useLocation } from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';

import { TopBar } from 'renderer/components/shell/TopBar';
import { MainLayout } from 'renderer/components/shell/MainLayout';
import { EditorTabs } from 'renderer/components/shell/EditorTabs';

import './Shell.less';
import { useKapetaContext } from 'renderer/hooks/contextHook';
import { useBackgroundTasks } from './hooks/useBackgroundTasks';
import { useNotifications } from '../hooks/useNotifications';
import { useEffect } from 'react';
import { KindIcon, SimpleLoader } from '@kapeta/ui-web-components';
import { LoginScreen } from './LoginScreen';
import { MainTabsContextProvider, useMainTabs } from '../hooks/mainTabs';
import { usePrevious } from 'react-use';
import { NavigationButtons } from 'renderer/components/shell/NavigationButtons';
import { Stack, Box } from '@mui/system';
import { SvgIcon } from '@mui/material';
import DeployIcon from '../components/shell/components/icons/DeployIcon.svg';

const BASE_TRACKING_URL = 'https://desktop.kapeta.com';

interface Props {}

const InnerShell = (props: Props) => {
    const contexts = useKapetaContext();
    const [notifications, notificationsHandler] = useNotifications();
    useBackgroundTasks(notificationsHandler);

    return (
        <MainTabsContextProvider>
            <TopBar notifications={notifications}>
                <Stack
                    direction={'row'}
                    sx={{
                        width: '240px',
                        minWidth: '240px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                >
                    <Box sx={{ flexGrow: 1 }} className="allow-drag-app" />
                    <NavigationButtons />
                </Stack>

                <EditorTabs />
            </TopBar>
            <MainLayout
                location={location}
                menu={[
                    {
                        id: 'edit',
                        path: '/edit',
                        loading: false,
                        name: 'Edit',
                        open: false,
                        icon: <KindIcon kind="core/plan" size={24} />,
                        'data-kap-id': 'app-left-menu-edit-button',
                    },
                    {
                        id: 'deploy',
                        path: '/deployments',
                        loading: false,
                        name: 'Deploy',
                        open: false,
                        icon: <SvgIcon component={DeployIcon} width={24} height={24} />,
                        'data-kap-id': 'app-left-menu-deploy-button',
                    },
                ]}
                context={{
                    identity: contexts.profile,
                    contexts:
                        contexts.contexts?.memberships.map((m) => ({
                            ...m.identity,
                            current:
                                m.identity.handle ===
                                (contexts.activeContext?.identity.handle || contexts.contexts?.current),
                        })) || ([] as any[]),
                    refreshContexts: contexts.refreshContexts,
                    setActiveContext: (ctx) => {
                        const member = contexts.contexts?.memberships.find((m) => m.identity.handle === ctx.handle);
                        member && contexts.setActiveContext(member);
                    },
                    activeContext: contexts.activeContext,
                }}
            >
                <Outlet />
            </MainLayout>
        </MainTabsContextProvider>
    );
};

export function Shell() {
    const location = useLocation();
    const contexts = useKapetaContext();

    useEffect(() => {
        if (!window.analytics) {
            return;
        }
        if (contexts.profile) {
            window.analytics.identify(contexts.profile.id, {
                name: contexts.profile.name,
                username: contexts.profile.handle,
            });
        }
        if (
            contexts.profile?.id &&
            contexts.activeContext &&
            contexts.activeContext.identity.id !== contexts.profile.id
        ) {
            window.analytics.group(contexts.activeContext.identity.id, {
                name: contexts.activeContext.identity.name,
                handle: contexts.activeContext.identity.handle,
            });
        }
    }, [contexts.activeContext, contexts.profile]);

    const previousPath = usePrevious(location.pathname);

    useEffect(() => {
        if (!window.analytics) {
            return;
        }
        const url = BASE_TRACKING_URL + location.pathname;
        const referrer = previousPath ? BASE_TRACKING_URL + previousPath : undefined;
        window.analytics.page(location.pathname, {
            path: location.pathname,
            referrer,
            url,
        });
    }, [location.pathname, previousPath]);

    return (
        <SimpleLoader text="Initialising application..." loading={contexts.loading}>
            {contexts.profile ? <InnerShell /> : <LoginScreen onClickLogin={contexts.logIn} />}
        </SimpleLoader>
    );
}
