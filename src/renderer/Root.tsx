import './shared-libraries';

import React, { useState } from 'react';
import { Provider } from 'mobx-react';
import { SimpleLoader } from '@blockware/ui-web-components';

import Application from './views/Application';

import './index.less';

import { initialise } from './context';

export const Root = () => {
    const [loading, setLoading] = useState(true);

    return (
        <Provider>
            <SimpleLoader
                text="Initialising application..."
                loader={async () => {
                    await initialise();
                    setLoading(false);
                }}
            >
                {!loading && <Application key="main" />}
            </SimpleLoader>
        </Provider>
    );
};
