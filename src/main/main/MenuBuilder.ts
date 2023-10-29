/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { app, Menu, shell, BrowserWindow, MenuItemConstructorOptions } from 'electron';
import { AutoUpdateHelper } from './AutoUpdateHelper';
import { appVersion } from '../helpers';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
    selector?: string;
    submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export class MenuBuilder {
    private readonly mainWindow: BrowserWindow;
    private readonly autoUpdater: AutoUpdateHelper;

    constructor(mainWindow: BrowserWindow, autoUpdater: AutoUpdateHelper) {
        this.mainWindow = mainWindow;
        this.autoUpdater = autoUpdater;
    }

    buildMenu(): Menu {
        this.setupContextMenu();

        const template = process.platform === 'darwin' ? this.buildDarwinTemplate() : this.buildDefaultTemplate();

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);

        return menu;
    }

    setupContextMenu(): void {
        this.mainWindow.webContents.on('context-menu', (_, props) => {
            const { x, y } = props;

            Menu.buildFromTemplate([
                {
                    label: 'Inspect element',
                    click: () => {
                        this.mainWindow.webContents.inspectElement(x, y);
                    },
                },
            ]).popup({ window: this.mainWindow });
        });
    }

    private checkForUpdates() {
        this.autoUpdater.checkForUpdates(this.mainWindow, true);
    }

    private buildTabMenu(): MenuItemConstructorOptions {
        return {
            label: 'Tab',
            submenu: [
                {
                    label: 'New Tab',
                    accelerator: 'CmdOrCtrl+T',
                    click: () => {
                        this.mainWindow?.webContents.send('change-tab', 'new');
                    },
                },
                {
                    label: 'Reopen Closed Tab',
                    accelerator: 'CmdOrCtrl+Shift+T',
                    click: () => {
                        this.mainWindow?.webContents.send('change-tab', 'reopen');
                    },
                },
                {
                    label: 'Close Tab',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => {
                        this.mainWindow?.webContents.send('change-tab', 'close');
                    },
                },
                ...['Ctrl+Tab', 'CmdOrCtrl+Option+Right', 'CmdOrCtrl+Shift+]'].map((accelerator, i) => ({
                    label: 'Next Tab',
                    accelerator,
                    visible: i === 0,
                    click: () => {
                        this.mainWindow?.webContents.send('change-tab', 'next');
                    },
                })),
                ...['Ctrl+Shift+Tab', 'CmdOrCtrl+Option+Left', 'CmdOrCtrl+Shift+['].map((accelerator, i) => ({
                    label: 'Previous Tab',
                    accelerator,
                    visible: i === 0,
                    click: () => {
                        this.mainWindow?.webContents.send('change-tab', 'prev');
                    },
                })),
                ...[
                    'CmdOrCtrl+1',
                    'CmdOrCtrl+2',
                    'CmdOrCtrl+3',
                    'CmdOrCtrl+4',
                    'CmdOrCtrl+5',
                    'CmdOrCtrl+6',
                    'CmdOrCtrl+7',
                    'CmdOrCtrl+8',
                    'CmdOrCtrl+9',
                ].map((accelerator, i) => ({
                    label: `Switch to Tab ${i + 1}`,
                    accelerator,
                    click: () => {
                        this.mainWindow?.webContents.send('change-tab', 'switch', i);
                    },
                })),
            ],
        };
    }

    private buildDarwinTemplate(): MenuItemConstructorOptions[] {
        const subMenuAbout: DarwinMenuItemConstructorOptions = {
            label: 'Kapeta',
            submenu: [
                {
                    label: 'About Kapeta',
                    selector: 'orderFrontStandardAboutPanel:',
                },
                {
                    label: 'Check for Updates...',
                    click: () => {
                        this.checkForUpdates();
                    },
                },
                { type: 'separator' },
                { label: 'Services', submenu: [] },
                { type: 'separator' },
                {
                    label: 'Hide Kapeta',
                    accelerator: 'Command+H',
                    selector: 'hide:',
                },
                {
                    label: 'Hide Others',
                    accelerator: 'Command+Shift+H',
                    selector: 'hideOtherApplications:',
                },
                { label: 'Show All', selector: 'unhideAllApplications:' },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: () => {
                        app.quit();
                    },
                },
            ],
        };
        const subMenuEdit: DarwinMenuItemConstructorOptions = {
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
                {
                    label: 'Redo',
                    accelerator: 'Shift+Command+Z',
                    selector: 'redo:',
                },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
                { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
                {
                    label: 'Paste',
                    accelerator: 'Command+V',
                    selector: 'paste:',
                },
                {
                    label: 'Select All',
                    accelerator: 'Command+A',
                    selector: 'selectAll:',
                },
            ],
        };
        const subMenuView: MenuItemConstructorOptions = {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'Command+R',
                    click: () => {
                        this.mainWindow.webContents.reload();
                    },
                },
                {
                    label: 'Toggle Full Screen',
                    accelerator: 'Ctrl+Command+F',
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                    },
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'Alt+Command+I',
                    click: () => {
                        this.mainWindow.webContents.toggleDevTools();
                    },
                },
            ],
        };

        const subMenuWindow: DarwinMenuItemConstructorOptions = {
            label: 'Window',
            submenu: [
                {
                    label: 'Minimize',
                    accelerator: 'Command+M',
                    selector: 'performMiniaturize:',
                },
                {
                    label: 'Close',
                    accelerator: 'Command+W',
                    selector: 'performClose:',
                },
                { type: 'separator' },
                { label: 'Bring All to Front', selector: 'arrangeInFront:' },
            ],
        };
        const subMenuHelp: MenuItemConstructorOptions = {
            label: 'Help',
            submenu: [
                {
                    label: 'Learn More',
                    click() {
                        shell.openExternal('https://kapeta.com');
                    },
                },
                {
                    label: 'Documentation',
                    click() {
                        shell.openExternal('https://docs.kapeta.com');
                    },
                },
            ],
        };

        return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, this.buildTabMenu(), subMenuHelp];
    }

    buildDefaultTemplate() {
        const templateDefault: MenuItemConstructorOptions[] = [
            {
                label: '&File',
                submenu: [
                    {
                        label: '&Open',
                        accelerator: 'Ctrl+O',
                    },
                    {
                        label: '&Close',
                        accelerator: 'Ctrl+W',
                        click: () => {
                            this.mainWindow.close();
                        },
                    },
                ],
            },
            {
                label: '&Edit',
                submenu: [
                    { label: '&Undo', accelerator: 'Ctrl+Z', role: 'undo' },
                    {
                        label: '&Redo',
                        accelerator: 'Shift+Ctrl+Z',
                        role: 'redo',
                    },
                    { type: 'separator' },
                    { label: '&Cut', accelerator: 'Ctrl+X', role: 'cut' },
                    { label: '&Copy', accelerator: 'Ctrl+C', role: 'copy' },
                    {
                        label: '&Paste',
                        accelerator: 'Ctrl+V',
                        role: 'paste',
                    },
                    {
                        label: '&Select All',
                        accelerator: 'Ctrl+A',
                        role: 'selectAll',
                    },
                ],
            },
            {
                label: '&View',
                submenu: [
                    {
                        label: '&Reload',
                        accelerator: 'Ctrl+R',
                        click: () => {
                            this.mainWindow.webContents.reload();
                        },
                    },
                    {
                        label: 'Toggle &Full Screen',
                        accelerator: 'F11',
                        click: () => {
                            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                        },
                    },
                    {
                        label: 'Toggle &Developer Tools',
                        accelerator: 'Alt+Ctrl+I',
                        click: () => {
                            this.mainWindow.webContents.toggleDevTools();
                        },
                    },
                ],
            },
            this.buildTabMenu(),
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'Version: ' + appVersion(),
                        enabled: false,
                    },
                    {
                        label: 'Learn More',
                        click() {
                            shell.openExternal('https://kapeta.com');
                        },
                    },
                    {
                        label: 'Documentation',
                        click() {
                            shell.openExternal('https://docs.kapeta.com');
                        },
                    },
                    {
                        label: 'Check for Updates...',
                        click: () => {
                            this.checkForUpdates();
                        },
                    },
                ],
            },
        ];

        return templateDefault;
    }
}
