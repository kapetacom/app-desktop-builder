import { Outlet, useLocation } from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';

import { TopBar } from 'renderer/components/shell/TopBar';
import { MainLayout } from 'renderer/components/shell/MainLayout';
import { EditorTabs } from 'renderer/components/shell/EditorTabs';
import { CustomIcon } from 'renderer/components/shell/components/CustomIcon';

import './Shell.less';
import { useKapetaContext } from 'renderer/hooks/contextHook';
import { useBackgroundTasks } from './hooks/useBackgroundTasks';
import { useNotifications } from '../hooks/useNotifications';
import { useEffect } from 'react';
import { KapetaNotification } from '../components/shell/types';
import { SimpleLoader } from '@kapeta/ui-web-components';
import { LoginScreen } from './LoginScreen';
import { MainTabsContextProvider } from '../hooks/mainTabs';
import { usePrevious } from 'react-use';

const BASE_TRACKING_URL = 'https://desktop.kapeta.com';

interface Props {}

const InnerShell = (props: Props) => {
    const contexts = useKapetaContext();
    const [notifications, notificationsHandler] = useNotifications();
    useBackgroundTasks(notificationsHandler);

    return (
        <MainTabsContextProvider>
            <MainLayout
                location={location}
                topBar={
                    <TopBar notifications={notifications}>
                        <EditorTabs />
                    </TopBar>
                }
                menu={[
                    {
                        id: 'edit',
                        path: '/edit',
                        loading: false,
                        name: 'Edit',
                        open: false,
                        icon: <CustomIcon icon="Plan" />,
                    },
                    {
                        id: 'deploy',
                        path: '/deployments',
                        loading: false,
                        name: 'Deploy',
                        open: false,
                        icon: <CustomIcon icon="Deploy" />,
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
    }, [contexts.profile?.id, contexts.activeContext?.identity.id]);

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
            url: url,
        });
    }, [location.pathname]);

    return (
        <SimpleLoader text="Initialising application..." loading={contexts.loading}>
            {contexts.profile ? <InnerShell /> : <LoginScreen onClickLogin={contexts.logIn} />}
        </SimpleLoader>
    );
}
