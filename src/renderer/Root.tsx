import './shared-libraries.js'

import React from 'react';
import Application from './views/Application';
import { Provider } from 'mobx-react';

import './index.less';

import {initialise} from "./context";
import { Loader } from '@blockware/ui-web-components';

export const Root = () => (
    <Provider>
        <Loader load={async () => {
            await initialise();
            return (
                <Application key="main" />
            )
        }} />
    </Provider>
)
