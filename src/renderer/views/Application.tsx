import React, {useEffect} from 'react';
import { DefaultContext } from '@blockware/ui-web-components';

import Main from './Main';
import 'react-toastify/dist/ReactToastify.css';

import './Application.less';
import { AssetService } from '@blockware/ui-web-context';

const Application: React.FC = (props: any) => {

  useEffect(() => {
    return AssetService.subscribe((evt) => {
      //We just brute-force reload since this might remove or introduce new providers or assets.
      //TODO: Make this smarter and only do full reloads when absolutely needed
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
