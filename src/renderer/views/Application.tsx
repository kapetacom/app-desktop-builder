import React, {useEffect} from 'react';
import { DefaultContext } from '@blockware/ui-web-components';

import Main from './Main';
import 'react-toastify/dist/ReactToastify.css';

import './Application.less';
import { AssetService } from '@blockware/ui-web-context';

const Application: React.FC = (props: any) => {

  useEffect(() => {
    return AssetService.subscribe((evt) => {
      if (['added','removed'].indexOf(evt.payload.type) === -1) {
        return; //We don't care about updated here
      }
      //TODO: Make smarter - add or remove specific providers instead of just reloading everything
      window.location.reload();
    });
  });

    return (
        <DefaultContext>
            <Main/>
        </DefaultContext>
    );
};

export default Application;
