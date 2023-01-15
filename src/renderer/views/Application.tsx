import React from 'react';
import { DefaultContext } from '@blockware/ui-web-components';

import Main from './Main';
import 'react-toastify/dist/ReactToastify.css';

import './Application.less';

const Application: React.FC = (props: any) => {

    return (
        <DefaultContext>
            <Main/>
        </DefaultContext>
    );
};

export default Application;
