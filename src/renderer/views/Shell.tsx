import { Outlet, useLocation } from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';

import { toClass } from '@kapeta/ui-web-utils';

import { TopBar } from 'renderer/components/shell/TopBar';
import { MainLayout } from 'renderer/components/shell/MainLayout';
import { EditorTabs } from 'renderer/components/shell/EditorTabs';

import './Shell.less';
import { useLocalStorage } from '../utils/localStorage';

export function Shell() {
    const [error, setError] = useLocalStorage('$main_error', '');
    const location = useLocation();

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
            handle="derp"
            menu={[]}
        >
            <Outlet />
        </MainLayout>
    );
}
