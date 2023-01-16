import './shared-libraries.js'

import React, {useState} from 'react';
import Application from './views/Application';
import {Provider} from 'mobx-react';

import './index.less';

import {initialise} from "./context";
import {SimpleLoader} from '@blockware/ui-web-components';

export const Root = () => {

  const [loading, setLoading] = useState(true);

  return (
    <Provider>
      <SimpleLoader text={'Initialising application...'}
                    loader={async () => {
                      await initialise();
                      setLoading(false);
                    }}>
        {!loading && <Application key="main"/>}
      </SimpleLoader>
    </Provider>
  );
}
