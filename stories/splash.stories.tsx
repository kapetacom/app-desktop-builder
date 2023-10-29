/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useEffect, useState } from 'react';

import './index.less';
import { SplashContent, SplashStatusCheck } from '../src/renderer/modals/splash/SplashContent';
import { kapetaDark, kapetaLight } from '../src/renderer/Theme';
import { ThemeProvider } from '@mui/material';

export default {
    title: 'Splash',
};

export const SplashFailAll = () => {
    const [dockerStatus, setDockerStatus] = useState<SplashStatusCheck>(SplashStatusCheck.LOADING);
    const [localClusterStatus, setLocalClusterStatus] = useState<SplashStatusCheck>(SplashStatusCheck.LOADING);

    const [npmStatus, setNpmStatus] = useState<SplashStatusCheck>(SplashStatusCheck.LOADING);

    useEffect(() => {
        setTimeout(() => {
            setDockerStatus(SplashStatusCheck.ERROR);
        }, 1000);

        setTimeout(() => {
            setNpmStatus(SplashStatusCheck.ERROR);
        }, 600);

        setTimeout(() => {
            setLocalClusterStatus(SplashStatusCheck.ERROR);
        }, 2000);
    }, []);

    return (
        <ThemeProvider theme={kapetaLight}>
            <SplashContent
                onRetry={() => {
                    setDockerStatus(SplashStatusCheck.LOADING);
                    setTimeout(() => {
                        setDockerStatus(SplashStatusCheck.OK);
                    }, 2000);
                }}
                onQuit={() => {
                    setLocalClusterStatus(SplashStatusCheck.LOADING);
                    setTimeout(() => {
                        setLocalClusterStatus(SplashStatusCheck.OK);
                    }, 5000);
                }}
                npmStatus={npmStatus}
                dockerStatus={dockerStatus}
                localClusterStatus={localClusterStatus}
            />
        </ThemeProvider>
    );
};
export const SplashFailLocalCluster = () => {
    const [dockerStatus, setDockerStatus] = useState<SplashStatusCheck>(SplashStatusCheck.LOADING);
    const [localClusterStatus, setLocalClusterStatus] = useState<SplashStatusCheck>(SplashStatusCheck.LOADING);

    const [npmStatus, setNpmStatus] = useState<SplashStatusCheck>(SplashStatusCheck.LOADING);

    useEffect(() => {
        setTimeout(() => {
            setDockerStatus(SplashStatusCheck.OK);
        }, 1000);

        setTimeout(() => {
            setNpmStatus(SplashStatusCheck.ERROR);
        }, 600);

        setTimeout(() => {
            setLocalClusterStatus(SplashStatusCheck.ERROR);
        }, 2000);
    }, []);

    return (
        <ThemeProvider theme={kapetaLight}>
            <SplashContent
                onRetry={() => {
                    setDockerStatus(SplashStatusCheck.LOADING);
                    setTimeout(() => {
                        setDockerStatus(SplashStatusCheck.OK);
                    }, 2000);
                }}
                onQuit={() => {
                    setLocalClusterStatus(SplashStatusCheck.LOADING);
                    setTimeout(() => {
                        setLocalClusterStatus(SplashStatusCheck.OK);
                    }, 5000);
                }}
                npmStatus={npmStatus}
                dockerStatus={dockerStatus}
                localClusterStatus={localClusterStatus}
            />
        </ThemeProvider>
    );
};
export const SplashFailDocker = () => {
    const [dockerStatus, setDockerStatus] = useState<SplashStatusCheck>(SplashStatusCheck.LOADING);
    const [localClusterStatus, setLocalClusterStatus] = useState<SplashStatusCheck>(SplashStatusCheck.LOADING);

    const [npmStatus, setNpmStatus] = useState<SplashStatusCheck>(SplashStatusCheck.LOADING);

    useEffect(() => {
        setTimeout(() => {
            setDockerStatus(SplashStatusCheck.ERROR);
        }, 1000);

        setTimeout(() => {
            setNpmStatus(SplashStatusCheck.OK);
        }, 600);

        setTimeout(() => {
            setLocalClusterStatus(SplashStatusCheck.OK);
        }, 2000);
    }, []);

    return (
        <ThemeProvider theme={kapetaLight}>
            <SplashContent
                onRetry={() => {
                    setDockerStatus(SplashStatusCheck.LOADING);
                    setTimeout(() => {
                        setDockerStatus(SplashStatusCheck.OK);
                    }, 2000);
                }}
                onQuit={() => {
                    setLocalClusterStatus(SplashStatusCheck.LOADING);
                    setTimeout(() => {
                        setLocalClusterStatus(SplashStatusCheck.OK);
                    }, 5000);
                }}
                npmStatus={npmStatus}
                dockerStatus={dockerStatus}
                localClusterStatus={localClusterStatus}
            />
        </ThemeProvider>
    );
};

export const SplashOk = () => {
    const [dockerStatus, setDockerStatus] = useState<SplashStatusCheck>(SplashStatusCheck.LOADING);
    const [localClusterStatus, setLocalClusterStatus] = useState<SplashStatusCheck>(SplashStatusCheck.LOADING);

    const [npmStatus, setNpmStatus] = useState<SplashStatusCheck>(SplashStatusCheck.LOADING);

    useEffect(() => {
        setTimeout(() => {
            setDockerStatus(SplashStatusCheck.OK);
        }, 2000);

        setTimeout(() => {
            setNpmStatus(SplashStatusCheck.OK);
        }, 600);

        setTimeout(() => {
            setLocalClusterStatus(SplashStatusCheck.OK);
        }, 5000);
    }, []);

    return (
        <ThemeProvider theme={kapetaLight}>
            <SplashContent
                onRetry={() => {
                    setDockerStatus(SplashStatusCheck.LOADING);
                    setTimeout(() => {
                        setDockerStatus(SplashStatusCheck.OK);
                    }, 2000);
                }}
                onQuit={() => {
                    setLocalClusterStatus(SplashStatusCheck.LOADING);
                    setTimeout(() => {
                        setLocalClusterStatus(SplashStatusCheck.OK);
                    }, 5000);
                }}
                npmStatus={npmStatus}
                dockerStatus={dockerStatus}
                localClusterStatus={localClusterStatus}
            />
        </ThemeProvider>
    );
};
