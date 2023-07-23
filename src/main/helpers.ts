/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';

const ENABLE_EXTENSIONS = false; //Disabled because Electron doesn't support react extension currently

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

    if (isDebug() && ENABLE_EXTENSIONS) {
        await installExtensions();
    }
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

export const initAutoUpdater = async () => {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    await autoUpdater.checkForUpdatesAndNotify();
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