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
                onRestartCluster={() => {
                    window.electron.ipcRenderer.sendMessage('splash', [
                        'restart-cluster',
                    ]);
                }}
                onCheckDocker={() => {
                    window.electron.ipcRenderer.sendMessage('splash', [
                        'recheck-docker',
                    ]);
                }}
                localClusterStatus={state.localClusterStatus}
                dockerStatus={state.dockerStatus}
            />
        </ThemeProvider>
    );
}

window.electron.ipcRenderer.on('splash', ([eventType, data]) => {
    if (eventType === 'changed') {
        render({
            localClusterStatus: SplashStatusCheck.OK,
            dockerStatus: data.dockerStatus
                ? SplashStatusCheck.OK
                : SplashStatusCheck.ERROR,
        });
    }

    if (eventType === 'failed') {
        render({
            localClusterStatus: SplashStatusCheck.ERROR,
            dockerStatus: SplashStatusCheck.ERROR,
        });
    }

    if (eventType === 'start') {
        render({
            localClusterStatus: SplashStatusCheck.LOADING,
            dockerStatus: SplashStatusCheck.LOADING,
        });
    }
});

render({
    localClusterStatus: SplashStatusCheck.LOADING,
    dockerStatus: SplashStatusCheck.LOADING,
});
