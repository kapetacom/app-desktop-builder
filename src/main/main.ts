/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import './shell/shell-helpers';

import { app, dialog } from 'electron';
import { appInit } from './helpers';
import { MainWindow } from './main/MainWindow';
import { ClusterService } from './services/ClusterService';
import { SplashScreen } from './modals/SplashScreen';
import { attachHandlers } from './services/IPCService';

const clusterService = new ClusterService();
const splashScreen = new SplashScreen(clusterService);

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
    // We only want one instance of the app running at a time
    app.quit();
    process.exit();
}

app.on('window-all-closed', () => {
    // Do not close app when windows close. We still have the tray
});

app.on('quit', async () => {
    await clusterService.stop();
});

appInit()
    .then(() => splashScreen.open())
    .then(async () => {
        const main = new MainWindow(clusterService);
        attachHandlers(main);
        await main.open();

        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // TODO: Handle if the user tries to open a file
            // Someone tried to run a second instance, we should focus our window.
            main.show();
        });

        app.on('activate', () => main.show());
        if (app.show) {
            app.show();
        }
    })
    .catch((err) => {
        console.error(err);
        // Show a blocking error popup before exiting
        app.focus();
        dialog.showErrorBox('An error occurred during startup', err.stack);
        app.exit(1);
    });
