/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { ipcMain, dialog, shell } from 'electron';
import { KapetaAPI } from '@kapeta/nodejs-api-client';
import { MainWindow } from '../main/MainWindow';
import FS from 'fs-extra';
import OpenDialogOptions = Electron.OpenDialogOptions;
import { findEditorOrDefault, launchExternalEditor } from '@kapeta/electron-ide-opener';
import ClusterConfiguration from '@kapeta/local-cluster-config';
import YAML from 'yaml';

export function attachHandlers(main: MainWindow) {
    ipcMain.handle('get-token', async () => {
        try {
            const api = new KapetaAPI();
            if (!api.hasToken()) {
                return null;
            }
            return await api.getAccessToken();
        } catch (err) {
            // Expected error when user is not logged in
            console.error('Failed to get access token', err);
        }
    });

    //
    ipcMain.handle('get-contexts', async () => {
        try {
            const api = new KapetaAPI();
            if (!api.hasToken()) {
                return {
                    memberships: [],
                    current: '',
                };
            }
            const identity = await api.getCurrentIdentity();
            const context = await api.getCurrentContext();
            const memberships = await api.getCurrentMemberships();

            return {
                memberships: [{ identity }, ...memberships],
                current: context?.identity.handle || identity.handle,
            };
        } catch (err) {
            // Expected error when user is not logged in
            if (err && (err as Error).message?.includes('No current identity')) {
                return {
                    memberships: [],
                    current: '',
                };
            }

            console.error('Failed to get contexts', err);
        }
    });

    ipcMain.handle('log-out', async () => {
        try {
            const api = new KapetaAPI();
            const result = api.removeToken();
            await main.update();
            return result;
        } catch (err) {
            console.error('Failed to log out', err);
            return false;
        }
    });

    ipcMain.handle('log-in', async () => {
        try {
            const api = new KapetaAPI();
            await api.doDeviceAuthentication({
                onVerificationCode: (url: string) => {
                    shell.openExternal(url);
                },
            });
            await main.update();
            return { success: true };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    });

    ipcMain.handle('quit-and-install', async () => {
        main.quitAndInstall();
    });

    ipcMain.handle('set-context', async (evt, ...args: any[]) => {
        try {
            const api = new KapetaAPI();
            const handle = args && args[0] ? args[0] : undefined;
            if (handle) {
                await api.switchContextTo(args && args[0]);
            } else {
                await api.removeContext();
            }
            await main.update();
        } catch (err) {
            console.error('Failed to set context', args, err);
        }
    });

    ipcMain.handle('refresh-context', async () => {
        try {
            await main.update();
        } catch (err) {
            console.error('Failed to refresh context', err);
        }
    });

    ipcMain.handle('open-file-dialog', async (evt, ...args: any[]) => {
        try {
            const opts = args[0] as OpenDialogOptions & {
                readContent?: boolean;
            };
            const dialogResponse = await dialog.showOpenDialog(opts);
            if (opts.properties?.includes('multiSelections')) {
                return [dialogResponse];
            }

            let content: string | null = null;
            if (!dialogResponse.canceled && dialogResponse.filePaths[0] && opts.readContent) {
                content = (await FS.readFile(dialogResponse.filePaths[0])).toString();
            }

            return [dialogResponse, content];
        } catch (err) {
            console.error('Failed to open file picker', args, err);
        }
    });

    ipcMain.handle('open-path', async (evt, path) => {
        try {
            const configData = await FS.readFile(ClusterConfiguration.getClusterConfigFile());
            const config = YAML.parse(configData.toString());

            const editor = await findEditorOrDefault(config?.filesystem?.editor || null);
            if (editor) {
                await launchExternalEditor(path, editor);
                return;
            }
        } catch (err) {
            console.error('Failed to find editor', err);
        }

        try {
            await shell.openPath(path);
        } catch (err) {
            console.error('Failed to open path', path, err);
        }
    });
}
