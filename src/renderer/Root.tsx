import './shared-libraries';

import React from 'react';
import { Provider } from 'mobx-react';
import { SimpleLoader } from '@blockware/ui-web-components';
import { useAsync } from 'react-use';

import Application from './views/Application';

import './index.less';

import { initialise } from './context';

export const Root = () => {
    const { loading, error } = useAsync(async () => {
        await initialise();
    });
    return (
        <Provider>
            <SimpleLoader text="Initialising application..." loading={loading}>
                <>
                    {error ? <pre>{error.message}</pre> : null}
                    {!loading && !error && <Application key="main" />}
                </>
            </SimpleLoader>
        </Provider>
    );
};
