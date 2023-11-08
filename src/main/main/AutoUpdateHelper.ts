/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { MainWindow } from './MainWindow';
import { safeSend } from '../helpers';
const AUTO_UPDATE_INTERVAL_MS = 10 * 60 * 1000;

// Configure auto updater
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.forceDevUpdateConfig = !!process.env.TEST_UPDATES;

export class AutoUpdateHelper {
    private initiated: boolean = false;
    private readonly updatesApplied = new Set<string>();
    private updatePromise: Promise<void> | undefined;
    private downloadReady: boolean = false;

    private send(
        main: BrowserWindow | undefined,
        // TODO: Should be in a shared type
        type: 'checking' | 'download:start' | 'download:complete' | 'done',
        initiatedByUser: boolean,
        data?: any
    ) {
        if (!main) {
            return;
        }

        safeSend(main.webContents, 'auto-updater', {
            type,
            initiatedByUser,
            data,
        });
    }

    async checkForUpdates(main: BrowserWindow | undefined, initiatedByUser = false) {
        if (this.updatePromise) {
            return this.updatePromise;
        }

        this.updatePromise = this.checkForUpdatesInner(main, initiatedByUser).finally(() => {
            this.updatePromise = undefined;
        });

        return this.updatePromise;
    }

    private async checkForUpdatesInner(main: BrowserWindow | undefined, initiatedByUser = false) {
        const currentVersion = app.getVersion();
        let nextVersion: string | undefined;
        this.send(main, 'checking', initiatedByUser);

        try {
            const updateCheckResult = await autoUpdater.checkForUpdates();
            nextVersion = updateCheckResult?.updateInfo.version;
            if (updateCheckResult?.downloadPromise) {
                this.send(main, 'download:start', initiatedByUser);
                try {
                    await updateCheckResult?.downloadPromise;
                    this.downloadReady = true;
                    this.send(main, 'download:complete', initiatedByUser);
                } catch (e) {
                    this.send(main, 'done', initiatedByUser, {
                        state: 'FAILED',
                        errorMessage: (e as Error).message,
                    });
                }
            }
        } catch (e) {
            // autoUpdater logs errors to electron-log automatically
        }

        // No updates
        if (
            !nextVersion ||
            nextVersion === currentVersion ||
            (!initiatedByUser && this.updatesApplied.has(nextVersion))
        ) {
            this.send(main, 'done', initiatedByUser, {
                state: 'NOT_AVAILABLE',
            });
            return;
        }

        // Mark this version as applied so we don't show the update notification again
        this.updatesApplied.add(nextVersion);

        // A new update is available!
        this.send(main, 'done', initiatedByUser, {
            state: 'AVAILABLE',
            currentVersion,
            nextVersion,
        });
    }

    public async init(main: MainWindow) {
        if (this.initiated) {
            return;
        }

        this.initiated = true;
        try {
            const autoChecker = async () => {
                await this.checkForUpdates(main.window);
                setTimeout(autoChecker, AUTO_UPDATE_INTERVAL_MS);
            };
            setTimeout(autoChecker, AUTO_UPDATE_INTERVAL_MS);
        } catch (e) {
            log.warn('Failed to initialize auto updater', e);
        }
    }

    quitAndInstall() {
        if (!this.downloadReady) {
            console.warn('Cannot quit and install, download is not ready');
            return;
        }
        autoUpdater.quitAndInstall();
    }
}
