/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import ClusterConfiguration from '@kapeta/local-cluster-config';
import { version } from '../../package.json';
import { KapetaAPI } from '@kapeta/nodejs-api-client';

export type Channels = 'ipc-main' | 'splash' | 'processing' | 'auth' | 'auto-updater' | 'change-tab' | 'settings';
export type Procedures =
    | 'get-token'
    | 'get-contexts'
    | 'log-in'
    | 'log-out'
    | 'refresh-context'
    | 'set-context'
    | 'quit-and-install'
    | 'open-file-dialog'
    | 'open-path';

const electronHandler = {
    ipcRenderer: {
        sendMessage(channel: Channels, args: any[]) {
            ipcRenderer.send(channel, args);
        },
        on(channel: Channels, func: (...args: any[]) => void) {
            const subscription = (_event: IpcRendererEvent, ...args: any[]) => func(...args);
            ipcRenderer.on(channel, subscription);

            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        },
        once(channel: Channels, func: (...args: any[]) => void) {
            ipcRenderer.once(channel, (_event, ...args) => func(...args));
        },
        invoke(channel: Procedures, ...args: any[]) {
            return ipcRenderer.invoke(channel, ...args);
        },
    },
};

contextBridge.exposeInMainWorld('electron', electronHandler);
// Load the Kapeta API
const kapetaApi = new KapetaAPI();
const getUrl = (prefix: string) => {
    const url = new URL(kapetaApi.getBaseUrl());
    url.host = [prefix, ...url.host.split('.').slice(1)].join('.');
    return url.toString();
};
const kapetaDesktop = {
    version,
    urls: {
        deployments: getUrl('web-deployments'),
        settings: getUrl('web-identity-provider'),
    },
    cluster_service: {
        url: ClusterConfiguration.getClusterServiceAddress(),
    },
};

contextBridge.exposeInMainWorld('KapetaDesktop', kapetaDesktop);
contextBridge.exposeInMainWorld('vscode', {
    // Is needed to convince monaco to render correctly - otherwise it will try to use UserAgent to determine
    // OS and fail since we override that to Kapeta
    // Is copied from https://github.com/microsoft/vscode/blob/main/src/vs/base/parts/sandbox/electron-sandbox/preload.js#L251
    process: {
        get platform() {
            return process.platform;
        },
        get arch() {
            return process.arch;
        },
        get env() {
            return { ...process.env };
        },
        get versions() {
            return process.versions;
        },
        get type() {
            return 'renderer';
        },
        get execPath() {
            return process.execPath;
        },
    },
});

export type KapetaDesktop = typeof kapetaDesktop;
export type ElectronHandler = typeof electronHandler;
