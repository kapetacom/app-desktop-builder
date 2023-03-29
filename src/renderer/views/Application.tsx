import React, { useEffect } from 'react';
import { DefaultContext } from '@kapeta/ui-web-components';
import { AssetService } from '@kapeta/ui-web-context';

import Main from './Main';
import 'react-toastify/dist/ReactToastify.css';

import './Application.less';

const Application: React.FC = () => {
    useEffect(() => {
        return AssetService.subscribe((evt) => {
            if (['added', 'removed'].indexOf(evt.payload.type) === -1) {
                return; // We don't care about updated here
            }
            // TODO: Make smarter - add or remove specific providers instead of just reloading everything
            window.location.reload();
        });
    });

    return (
        <DefaultContext>
            <Main />
        </DefaultContext>
    );
};

export default Application;
