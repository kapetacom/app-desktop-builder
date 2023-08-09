import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material';
import '../../index.less';
import { kapetaLight } from '../../Theme';
import { SplashContent, SplashStatusCheck } from './SplashContent';

const root = createRoot(document.getElementById('root')!);

interface State {
    localClusterStatus: SplashStatusCheck;
    dockerStatus: SplashStatusCheck;
    npmStatus: SplashStatusCheck;
}

function render(state: State) {
    root.render(
        <ThemeProvider theme={kapetaLight}>
            <SplashContent
                onDone={() => {
                    window.electron.ipcRenderer.sendMessage('splash', [
                        'close',
                    ]);
                }}
                onQuit={() => {
                    window.electron.ipcRenderer.sendMessage('splash', ['quit']);
                }}
                onRetry={() => {
                    window.electron.ipcRenderer.sendMessage('splash', [
                        'retry',
                    ]);
                }}
                localClusterStatus={state.localClusterStatus}
                dockerStatus={state.dockerStatus}
                npmStatus={state.npmStatus}
            />
        </ThemeProvider>
    );
}

window.electron.ipcRenderer.on('splash', ([eventType, data]) => {
    if (eventType === 'changed') {
        render({
            localClusterStatus: data.localClusterStatus === undefined ?
                SplashStatusCheck.LOADING
                : (data.localClusterStatus ?
                    SplashStatusCheck.OK
                    : SplashStatusCheck.ERROR),
            dockerStatus: data.dockerStatus === undefined ?
                SplashStatusCheck.LOADING
                : (data.dockerStatus ?
                    SplashStatusCheck.OK
                    : SplashStatusCheck.ERROR),
            npmStatus: data.npmStatus === undefined ?
                SplashStatusCheck.LOADING
                : (data.npmStatus ?
                    SplashStatusCheck.OK
                    : SplashStatusCheck.ERROR)

        });
    }

    if (eventType === 'failed') {
        render({
            localClusterStatus: SplashStatusCheck.ERROR,
            dockerStatus: SplashStatusCheck.ERROR,
            npmStatus: SplashStatusCheck.ERROR,
        });
    }

    if (eventType === 'start') {
        render({
            localClusterStatus: SplashStatusCheck.LOADING,
            dockerStatus: SplashStatusCheck.LOADING,
            npmStatus: SplashStatusCheck.LOADING,
        });
    }
});

render({
    localClusterStatus: SplashStatusCheck.LOADING,
    dockerStatus: SplashStatusCheck.LOADING,
    npmStatus: SplashStatusCheck.LOADING,
});
