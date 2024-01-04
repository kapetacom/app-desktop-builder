/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import request from 'request'; // Only used because it was already a dependency of the project
import ClusterConfiguration from '@kapeta/local-cluster-config';
import FS from 'fs-extra';
import YAML from 'yaml';
import { MainWindow } from '../main/MainWindow';

export type DesktopAppSettingsKey = 'show_pixel_grid' | 'snap_to_pixel_grid';

export type DesktopAppSettings = {
    show_pixel_grid?: boolean;
    snap_to_pixel_grid?: boolean;
};

export class SettingsService {
    main: MainWindow | undefined;
    clusterAddress: string = '';

    constructor(main: MainWindow) {
        this.main = main;
        this.clusterAddress = ClusterConfiguration.getClusterServiceAddress();
    }

    async get(): Promise<DesktopAppSettings> {
        // Default settings
        const settings = {
            show_pixel_grid: true,
            snap_to_pixel_grid: false,
        };

        try {
            // Read the cluster config file
            const configData = await FS.readFile(ClusterConfiguration.getClusterConfigFile());
            const config = YAML.parse(configData.toString());

            if (!config.app) {
                throw new Error('No app settings found in cluster config file');
            }

            if (config.app.show_pixel_grid !== undefined) {
                settings.show_pixel_grid = config.app.show_pixel_grid;
            }

            if (config.app.snap_to_pixel_grid !== undefined) {
                settings.snap_to_pixel_grid = config.app.snap_to_pixel_grid;
            }
        } catch (err) {
            console.error('Failed to get settings', err);
        }

        return settings;
    }

    async set(key: DesktopAppSettingsKey, value: string | boolean): Promise<void> {
        let path = this.clusterAddress;
        let body = '';

        switch (key) {
            case 'show_pixel_grid': {
                if (typeof value !== 'boolean') {
                    console.error('show_pixel_grid must be a boolean');
                    return;
                }
                path += '/files/show-pixel-grid';
                body = value.toString();
                break;
            }

            case 'snap_to_pixel_grid': {
                if (typeof value !== 'boolean') {
                    console.error('snap_to_pixel_grid must be a boolean');
                    return;
                }
                path += '/files/snap-to-pixel-grid';
                body = value.toString();
                break;
            }

            default: {
                key satisfies never;
                console.error(`Unknown setting key ${key}`);
                return;
            }
        }

        return new Promise((resolve, reject) => {
            request.post(path, { body: body }, (err, res, body) => {
                if (err) {
                    reject(new Error(`Failed to set ${key} to ${value}: ${err}`));
                    return;
                }

                if (res.statusCode > 399) {
                    reject(new Error(`Unexpected status code: ${res.statusCode}`));
                    return;
                }

                this.emitSettingChange();

                resolve(body);
            });
        });
    }

    async emitSettingChange() {
        this.main?.window?.webContents.send('desktop-app-settings', await this.get());
    }
}
