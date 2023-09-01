import { Outlet, useLocation } from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';

import { TopBar } from 'renderer/components/shell/TopBar';
import { MainLayout } from 'renderer/components/shell/MainLayout';
import { EditorTabs } from 'renderer/components/shell/EditorTabs';
import { CustomIcon } from 'renderer/components/shell/components/CustomIcon';

import './Shell.less';
import { useAsync } from 'react-use';
import { IdentityService } from '@kapeta/ui-web-context';
import { useLocalStorage } from '../utils/localStorage';
import { useKapetaContext } from 'renderer/hooks/contextHook';
import { useBackgroundTasks } from './hooks/useBackgroundTasks';
import { useNotifications } from '../hooks/useNotifications';
import { useEffect } from 'react';

export function Shell() {
    const [error, setError] = useLocalStorage('$main_error', '');
    const location = useLocation();

    const [notifications, notificationsHandler] = useNotifications();

    useBackgroundTasks(notificationsHandler);

    const identity = useAsync(() => {
        return IdentityService.getCurrent();
    });

    const contexts = useKapetaContext();

    if (error) {
        return <div className="error-details">{error}</div>;
    }

    useEffect(() => {
        if (identity.value) {
            window.analytics.identify(identity.value.id, {
                name: identity.value.name,
                username: identity.value.handle,
            });
        }
        if (identity.value?.id && contexts.activeContext && contexts.activeContext.identity.id !== identity.value.id) {
            window.analytics.group(contexts.activeContext.identity.id, {
                name: contexts.activeContext.identity.name,
                handle: contexts.activeContext.identity.handle,
            });
        }
    }, [identity.value?.id, contexts.activeContext?.identity.id]);

    useEffect(() => {
        window.analytics.page(location.pathname, {
            path: location.pathname,
            url: 'desktop://kapeta' + location.pathname,
        });
    }, [location.pathname]);

    return (
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
                        current: m.identity.handle === contexts.activeContext?.identity.handle,
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
    );
}
