/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { app, Menu, MenuItemConstructorOptions, shell, Tray, nativeTheme } from 'electron';
import { createFuture, getAssetPath, showError, showInfo, appVersion } from '../helpers';
import { ClusterService } from '../services/ClusterService';
import { MainWindow } from './MainWindow';
import { ModalProcessing } from '../modals/ModalProcessing';

import MenuItem = Electron.MenuItem;
import { MemberIdentity } from '@kapeta/ui-web-types';
import { getUrl } from 'main/baseUrl';

type TrayMenuItem = MenuItemConstructorOptions | MenuItem;

//Always use system theme
nativeTheme.themeSource = 'system';

const getTrayIcon = () => {
    if (process.platform !== 'darwin' && nativeTheme.shouldUseDarkColors) {
        return getAssetPath('icons/tray_icon_light.png');
    }

    // macOS tray icon supports "Template" image:
    // https://github.com/electron/electron/blob/main/docs/api/native-image.md#template-image
    return getAssetPath('icons/TrayIconTemplate.png');
};

export class TrayWrapper {
    private tray: Tray;
    private mainWindow: MainWindow;
    private processingModal: ModalProcessing;
    private clusterService: ClusterService;

    constructor(mainWindow: MainWindow, clusterService: ClusterService) {
        this.mainWindow = mainWindow;
        this.tray = new Tray(getTrayIcon());
        this.tray.setToolTip('Kapeta Desktop');
        this.processingModal = new ModalProcessing();
        this.clusterService = clusterService;

        nativeTheme.on('updated', () => {
            this.tray.setImage(getTrayIcon());
        });
    }

    public async update() {
        const menuItems: Array<TrayMenuItem> = [
            {
                label: 'Dashboard',
                click: () => this.mainWindow.show(),
            },
            { type: 'separator' },
            {
                label: 'Open Kapeta Cloud',
                click: () => shell.openExternal(getUrl('app')),
            },
            { type: 'separator' },
            {
                label: 'Version: ' + appVersion(),
                enabled: false,
                type: 'normal',
            },
            { label: 'Quit Kapeta', click: () => app.quit() },
        ];

        const contextMenu = Menu.buildFromTemplate(menuItems);
        this.tray.setContextMenu(contextMenu);
    }
}
