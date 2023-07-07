import { Outlet, useLocation } from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';

import { toClass } from '@kapeta/ui-web-utils';

import { TopBar } from 'renderer/components/shell/TopBar';
import { MainLayout } from 'renderer/components/shell/MainLayout';
import { EditorTabs } from 'renderer/components/shell/EditorTabs';

import './Shell.less';
import { useAsync } from 'react-use';
import { IdentityService } from '@kapeta/ui-web-context';
import { useLocalStorage } from '../utils/localStorage';

export function Shell() {
    const [error, setError] = useLocalStorage('$main_error', '');
    const location = useLocation();

    const identity = useAsync(() => {
        return IdentityService.getCurrent();
    });

    const contexts = useAsync(async () => {
        if (!identity.value) {
            return [];
        }
        const memberships = await IdentityService.getMemberships(
            identity.value.id
        );
        return [
            { ...identity.value, current: true },
            ...memberships.map((membership) => {
                return {
                    ...membership.identity,
                    current: false,
                };
            }),
        ];
    }, [identity.value]);

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
                <TopBar>
                    <EditorTabs />
                </TopBar>
            }
            handle={identity.value?.handle}
            menu={[
                {
                    id: 'edit',
                    path: '/edit',
                    loading: false,
                    name: 'Edit',
                    url: '',
                    open: false,
                },
                {
                    id: 'deploy',
                    path: '/deployments',
                    loading: false,
                    name: 'Deploy',
                    url: '',
                    open: false,
                },
                {
                    id: 'blockhub',
                    path: '/blockhub',
                    loading: false,
                    name: 'Blockhub',
                    url: 'https://app.kapeta.com/blockhub',
                    open: false,
                },
            ]}
            contexts={contexts.value}
        >
            <Outlet />
        </MainLayout>
    );
}
