/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { session, app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import packageJson from '../../package.json';

import MessageBoxOptions = Electron.MessageBoxOptions;

const ENABLE_EXTENSIONS = false; // Disabled because Electron doesn't support react extension currently

export const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

export const isDebug = (): boolean => {
    return !!(process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true');
};

export const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
};

export const appInit = async () => {
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
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['user-agent'] = userAgent;
        details.requestHeaders['x-kapeta'] = 'true';
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });
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
    return app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(__dirname, '../../.erb/dll/preload.js');
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

export const WindowOpenHandler = (edata: Electron.HandlerDetails): { action: 'deny' | 'allow' } => {
    if (/^https:\/\/[a-z.]+\.pendo\.io\//i.test(edata.url)) {
        // Allow Pendo to open within electron
        return { action: 'allow' };
    }

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
    let resolve;
    let reject;
    const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
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
