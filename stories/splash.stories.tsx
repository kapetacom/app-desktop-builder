import React from 'react';

import './index.less';
import { SplashContent, SplashStatusCheck } from '../src/renderer/splash';

export default {
    title: 'Splash',
};

export const SplashLoading = () => {
    return (
        <SplashContent
            text="Loading..."
            dockerStatus={SplashStatusCheck.LOADING}
            localClusterStatus={SplashStatusCheck.LOADING}
        />
    );
};

export const SplashOK = () => {
    return (
        <SplashContent
            text="Ready!"
            dockerStatus={SplashStatusCheck.OK}
            localClusterStatus={SplashStatusCheck.OK}
        />
    );
};

export const SplashFail = () => {
    return (
        <SplashContent
            text="Failed to load!"
            dockerStatus={SplashStatusCheck.ERROR}
            localClusterStatus={SplashStatusCheck.ERROR}
        />
    );
};
