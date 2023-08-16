/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import {
    session,
    app,
    BrowserWindow,
    ipcMain,
    shell,
    dialog,
    nativeImage,
} from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import packageJson from '../../package.json';

import MessageBoxOptions = Electron.MessageBoxOptions;

const ENABLE_EXTENSIONS = false; // Disabled because Electron doesn't support react extension currently
const AUTO_UPDATE_INTERVAL_MS = 60 * 1000; // TODO: Change to 10 min

export const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

export const isDebug = (): boolean => {
    return !!(
        process.env.NODE_ENV === 'development' ||
        process.env.DEBUG_PROD === 'true'
    );
};

export const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
};

export const appInit = async () => {
    await initAutoUpdater();

    if (isDebug()) {
        require('electron-debug')();
    }

    if (process.env.NODE_ENV === 'production') {
        const sourceMapSupport = require('source-map-support');
        sourceMapSupport.install();
    }

    await app.whenReady();

    ensureUserAgent();

    if (isDebug() && ENABLE_EXTENSIONS) {
        await installExtensions();
    }
};

export const appVersion = () => {
    return packageJson.version;
};

export const ensureUserAgent = () => {
    const userAgent = `KapetaDesktop/${appVersion()}`;
    session.defaultSession.setUserAgent(userAgent);
    session.defaultSession.webRequest.onBeforeSendHeaders(
        (details, callback) => {
            details.requestHeaders['user-agent'] = userAgent;
            details.requestHeaders['x-kapeta'] = 'true';
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        }
    );
};

export const attachIPCListener = (
    win: BrowserWindow,
    channel: string,
    listener: (...args: any[]) => void | Promise<void>
) => {
    ipcMain.on(channel, listener);
    win.on('close', () => {
        ipcMain.removeListener(channel, listener);
    });
};

export const getPreloadScript = () => {
    return app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js');
};

let hasUserChosenToUpdateLater = false;

export const checkForUpdates = async (initiatedByUser = false) => {
    try {
        const updateCheckResult = await autoUpdater.checkForUpdates();

        const currentVersion = app.getVersion();
        const nextVersion = updateCheckResult?.updateInfo.version;
        const icon = nativeImage.createFromPath(getAssetPath('icon.png'));

        if (nextVersion && nextVersion !== currentVersion) {
            // New update is available

            if (!hasUserChosenToUpdateLater || initiatedByUser) {
                const dialogOpts: MessageBoxOptions = {
                    icon,
                    buttons: ['Later', 'Quit and Install Now'],
                    defaultId: 1,
                    title: 'Update Available',
                    message: `Version ${nextVersion} is available. You are running version ${currentVersion}.`,
                    detail: 'Do you want to update now or later?',
                };

                const returnValue = showMessage(dialogOpts);

                if (returnValue === 1) {
                    autoUpdater.quitAndInstall();
                } else {
                    hasUserChosenToUpdateLater = true;
                }
            }
        } else if (initiatedByUser) {
            // No updates

            showMessage({
                icon,
                message: 'No Updates',
                detail: `You are running the latest version ${currentVersion}.`,
            });
        }
    } catch (e) {
        log.warn('Failed to check for updates', e);
    }
};

export const initAutoUpdater = async () => {
    try {
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        checkForUpdates();
        setInterval(checkForUpdates, AUTO_UPDATE_INTERVAL_MS);
    } catch (e) {
        log.warn('Failed to initialize auto updater', e);
    }
};

export const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS'];

    return installer
        .default(
            extensions.map((name) => installer[name]),
            forceDownload
        )
        .catch(console.log);
};

export const WindowOpenHandler = (
    edata: Electron.HandlerDetails
): { action: 'deny' } => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
};

export function resolveHtmlPath(htmlFileName: string) {
    if (process.env.NODE_ENV === 'development') {
        const port = process.env.PORT || 1212;
        const url = new URL(`http://localhost:${port}`);
        url.pathname = htmlFileName;
        return url.href;
    }
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export function createFuture() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

export function showError(message: string) {
    const opts: MessageBoxOptions = {
        type: 'error',
        message,
    };
    return showMessage(opts);
}

export function showInfo(message: string) {
    const opts: MessageBoxOptions = {
        type: 'info',
        message,
    };
    return showMessage(opts);
}

export function showMessage(opts: MessageBoxOptions) {
    const wins = BrowserWindow.getAllWindows();
    const win = wins.length > 0 ? wins[0] : null;
    if (win) {
        return dialog.showMessageBoxSync(win, opts);
    }
    return dialog.showMessageBoxSync(opts);
}
