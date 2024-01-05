/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import Path from 'path';
import { session, app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import packageJson from '../../package.json';

import MessageBoxOptions = Electron.MessageBoxOptions;
import FS from 'fs-extra';
import ClusterConfiguration from '@kapeta/local-cluster-config';
import WebContents = Electron.WebContents;

const ENABLE_EXTENSIONS = false; // Disabled because Electron doesn't support react extension currently

export const RESOURCES_PATH = app.isPackaged
    ? Path.join(process.resourcesPath, 'assets')
    : Path.join(__dirname, '../../assets');

export const isDebug = (): boolean => {
    return !!(process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true');
};

export const getAssetPath = (...paths: string[]): string => {
    return Path.join(RESOURCES_PATH, ...paths);
};

export const installOutputCatcher = () => {
    try {
        const logStream = FS.createWriteStream(
            Path.join(ClusterConfiguration.getKapetaBasedir(), 'kapeta-desktop.log'),
            {
                flags: 'w',
            }
        );
        logStream.on('error', (e) => {
            // Ignore
        });

        const writeChunk = (chunk: any) => {
            try {
                if (!logStream.closed) {
                    logStream.write(chunk);
                }
            } catch (e) {}
        };
        process.on('exit', () => logStream.end());
        const originalStdoutWrite = process.stdout.write.bind(process.stdout);
        // @ts-ignore
        process.stdout.write = (chunk: string | Uint8Array, encoding: BufferEncoding | undefined, callback: any) => {
            if (process.stdout.closed) {
                return;
            }

            try {
                writeChunk(chunk);
                return originalStdoutWrite(chunk, encoding, callback);
            } catch (e) {
                // Ignore
                console.warn('Failed to write to stdout', e);
                return false;
            }
        };

        const originalStderrWrite = process.stdout.write.bind(process.stderr);
        // @ts-ignore
        process.stderr.write = (chunk: string | Uint8Array, encoding: BufferEncoding | undefined, callback: any) => {
            if (process.stderr.closed) {
                return;
            }

            try {
                writeChunk(chunk);
                return originalStderrWrite(chunk, encoding, callback);
            } catch (e) {
                // Ignore
                console.warn('Failed to write to stderr', e);
                return false;
            }
        };

        console.log('Starting Kapeta in %s', app.getAppPath());
    } catch (e) {
        console.log('Failed to install output catcher', e);
    }
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

    if (process.platform === 'darwin' && app.getAppPath().startsWith('/Volumes/')) {
        // Looks like we're running from a DMG
        // This can cause issues with the auto-updater and probably other things
        showError(
            `It looks like you're running Kapeta from a DMG. Please copy it to your Applications folder to avoid issues.`
        );
    }

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
    return app.isPackaged ? Path.join(__dirname, 'preload.js') : Path.join(__dirname, '../../.erb/dll/preload.js');
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
    if (/^https:\/\/[a-z\.]+\.pendo\.io\//i.test(edata.url)) {
        // Allow Pendo to open within electron
        return { action: 'allow' };
    }

    shell.openExternal(edata.url);
    return { action: 'deny' };
};

export function resolveHtmlPath(htmlFileName: string) {
    if (process.env.NODE_ENV === 'development') {
        const port = process.env.PORT || 1212;
        const url = new URL(`http://127.0.0.1:${port}`);
        url.pathname = htmlFileName;
        return url.href;
    }
    return `file://${Path.resolve(__dirname, '../renderer/', htmlFileName)}`;
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

export function safeSend(contents: WebContents | undefined, channel: string, ...args: any[]) {
    try {
        contents && !contents.isDestroyed() && contents.send(channel, ...args);
    } catch (e) {
        console.warn('Failed to send message to renderer', e);
    }
}

export function withErrorLog(result: Promise<any>) {
    const stack = new Error().stack;
    result.catch((e) => {
        console.error('A method throw unexpected', e, stack);
    });
}

export function safeWindowInteraction(browserWindow: BrowserWindow, callback: () => void): void {
    if (browserWindow && !browserWindow.isDestroyed()) {
        callback();
    }
}
