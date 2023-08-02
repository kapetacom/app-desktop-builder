import {Outlet, useLocation} from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';

import {toClass} from '@kapeta/ui-web-utils';

import {TopBar} from 'renderer/components/shell/TopBar';
import {MainLayout} from 'renderer/components/shell/MainLayout';
import {EditorTabs} from 'renderer/components/shell/EditorTabs';
import {CustomIcon} from 'renderer/components/shell/components/CustomIcon';

import './Shell.less';
import {useAsync, useInterval, useList} from 'react-use';
import {IdentityService, InstanceEventType, InstanceService, SocketService} from '@kapeta/ui-web-context';
import {useLocalStorage} from '../utils/localStorage';
import {useKapetaContext} from 'renderer/hooks/contextHook';
import {KapetaNotification} from "../components/shell/types";
import {useDockerPullEvents} from "./hooks/useDockerPullEvents";
import {useNotificationListener, useNotifications} from "../hooks/useNotifications";



export function Shell() {
    const [error, setError] = useLocalStorage('$main_error', '');
    const location = useLocation();

    const [notifications, notificationsHandler] = useNotifications();

    useDockerPullEvents(notificationsHandler);

    const identity = useAsync(() => {
        return IdentityService.getCurrent();
    });

    const contexts = useKapetaContext();

    toClass({
        'main-container': true,
        error: !!error,
    });

    if (error) {
        return <div className="error-details">{error}</div>;
    }

    return (
        <MainLayout
            location={location}
            topBar={
                <TopBar
                    notifications={notifications}
                    profile={identity.value}>
                    <EditorTabs/>
                </TopBar>
            }
            menu={[
                {
                    id: 'edit',
                    path: '/edit',
                    loading: false,
                    name: 'Edit',
                    url: '',
                    open: false,
                    icon: <CustomIcon icon="Plan"/>,
                },
                {
                    id: 'deploy',
                    path: '/deployments',
                    loading: false,
                    name: 'Deploy',
                    url: '',
                    open: false,
                    icon: <CustomIcon icon="Deploy"/>,
                },
                {
                    id: 'blockhub',
                    path: '/blockhub',
                    loading: false,
                    name: 'Blockhub',
                    url: 'https://app.kapeta.com/blockhub',
                    open: false,
                    icon: <CustomIcon icon="Block"/>,
                },
            ]}
            context={{
                contexts: contexts.contexts?.memberships,
                setActiveContext: contexts.setActiveContext,
                activeContext: contexts.activeContext,
            }}
        >
            <Outlet/>
        </MainLayout>
    );
}
