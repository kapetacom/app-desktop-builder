/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
    app,
    BrowserWindow,
    dialog,
    Menu,
    MenuItemConstructorOptions,
    shell,
    Tray,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { KapetaAPI } from '@kapeta/nodejs-api-client';
import { execSync, spawnSync } from 'child_process';
import which from 'which';

import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { ClusterInfo, ClusterService } from './ClusterService';
import { SplashScreen } from './SplashScreen';
import { StatusCheck } from './SplashScreenStatus';
import MenuItem = Electron.MenuItem;

type TrayMenuItem = MenuItemConstructorOptions | MenuItem;

class AppUpdater {
    constructor() {
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        autoUpdater.checkForUpdatesAndNotify();
    }
}

let localClusterInfo: ClusterInfo | null = null;
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const clusterService = new ClusterService();

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

const isDebug =
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
    require('electron-debug')();
}

const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
};

const installExtensions = async () => {
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

const ensureWindow = async () => {
    if (mainWindow === null) {
        await createWindow();
    } else {
        mainWindow.focus();
    }
};

const ensureLocalCluster = async () => {
    if (!localClusterInfo) {
        localClusterInfo = await clusterService.start();
    }
};

const refreshTray = async () => {
    if (!tray) {
        tray = new Tray(getAssetPath('icons/16x16.png'));
        tray.setToolTip('Kapeta Desktop');
    }

    const api = new KapetaAPI();

    let userMenu: TrayMenuItem[];

    try {
        const identity = await api.getCurrentIdentity();
        const context = await api.getCurrentContext();
        const memberships = await api.getCurrentMemberships();
        userMenu = [
            {
                type: 'submenu',
                label: identity.name || identity.handle,
                submenu: [
                    {
                        label: 'Account Settings',
                        click: () => {
                            shell.openExternal(
                                `${api.getBaseUrl()}/${identity.handle}/iam`
                            );
                        },
                    },
                    {
                        label: 'Sign out',
                        click: async () => {
                            api.removeToken();
                            await refreshTray();
                        },
                    },
                ],
            },
        ];

        if (memberships.length > 0) {
            const contextMenus: MenuItemConstructorOptions[] = [];
            const membershipMenu: TrayMenuItem = {
                type: 'submenu',
                label: context
                    ? context.identity.name || context.identity.handle
                    : '<no context>',
                submenu: contextMenus,
            };

            memberships.forEach((membership) => {
                const isCurrent = !!(
                    context && context.identity.id === membership.identity.id
                );
                if (isCurrent) {
                    return;
                }

                const label = membership.identity.name;
                contextMenus.push({
                    label,
                    click: async () => {
                        await api.switchContextTo(membership.identity.handle);
                        await refreshTray();
                    },
                });
            });

            if (context) {
                contextMenus.push({
                    label: 'Remove context',
                    click: async () => {
                        await api.removeContext();
                        await refreshTray();
                    },
                });
            }

            userMenu.push(membershipMenu);
        }
    } catch (e) {
        userMenu = [
            {
                label: 'Sign in',
                click: async () => {
                    try {
                        await api.doDeviceAuthentication({
                            onVerificationCode: (url: string) => {
                                shell.openExternal(url);
                            },
                        });
                        await refreshTray();
                        const identity = await api.getCurrentIdentity();
                        dialog.showMessageBoxSync({
                            type: 'info',
                            message: `You were signed in as ${
                                identity.name || identity.handle
                            }!`,
                            title: 'Signed in!',
                        });
                    } catch (err: any) {
                        // Failed to complete
                        dialog.showErrorBox(
                            'Failed to authenticate',
                            e.message || e.error || 'Unknown error'
                        );
                    }
                },
            },
        ];
    }

    const isRunning = clusterService.isRunning();
    const menuItems: Array<TrayMenuItem> = [
        {
            label: isRunning
                ? `Local cluster: http://${localClusterInfo?.host}:${localClusterInfo?.port}`
                : 'Local cluster is stopped',
            enabled: false,
        },
        { type: 'separator' },
        {
            label: 'Dashboard',
            click: ensureWindow,
        },
        ...userMenu,
        { type: 'separator' },
        {
            label: isRunning ? 'Stop local cluster' : 'Start local cluster',
            click: async () => {
                if (isRunning) {
                    localClusterInfo = null;
                    if (mainWindow) {
                        mainWindow.close();
                    }
                    await clusterService.stop();
                } else {
                    try {
                        await ensureLocalCluster();
                    } catch (err) {
                        console.error(err);
                        dialog.showErrorBox(
                            'Failed to start local cluster',
                            err.message
                        );
                    }
                }

                await refreshTray();
            },
        },
        { type: 'separator' },
        {
            label: 'Open Kapeta Cloud',
            click: () => {
                shell.openExternal('https://app.kapeta.com');
            },
        },
        { type: 'separator' },
        { label: 'Quit Kapeta', click: () => app.quit() },
    ];
    const contextMenu = Menu.buildFromTemplate(menuItems);
    tray.setContextMenu(contextMenu);
};

const showDock = async () => {
    if (!app.dock) {
        return;
    }
    app.dock.setIcon(getAssetPath('icon.png'));
    await app.dock.show();
};

const hideDock = () => {
    if (!app.dock) {
        return;
    }

    app.dock.hide();
};

const createWindow = async () => {
    if (isDebug) {
        await installExtensions();
    }

    await showDock();
    mainWindow = new BrowserWindow({
        show: false,
        icon: getAssetPath('icon.png'),
        webPreferences: {
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    await refreshTray();

    mainWindow.maximize();
    const clusterServiceURL = localClusterInfo
        ? encodeURIComponent(
              `http://${localClusterInfo.host}:${localClusterInfo.port}`
          )
        : '';
    await mainWindow.loadURL(
        `${resolveHtmlPath(`index.html`)}#cluster_service=${clusterServiceURL}`
    );

    mainWindow.on('show', showDock);

    mainWindow.on('ready-to-show', async () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        mainWindow.show();
    });

    mainWindow.on('closed', async () => {
        mainWindow = null;
        hideDock();
        await refreshTray();
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: 'deny' };
    });

    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    new AppUpdater();
};

async function checkDockerBinary() {
    try {
        await which('docker');
    } catch (e) {
        throw new Error('docker binary not found');
    }
}

function checkDockerStatus() {
    const child = spawnSync('docker', ['ps']);
    if (child.status !== 0) {
        console.error(child.stdout?.toString('utf-8'));
        console.error(child.stderr?.toString('utf-8'));
        throw new Error('Docker does not seem to be running.');
    }
}

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
    // Do not close app when windows close. We still have the tray
});

app.on('quit', async () => {
    await clusterService.stop();
});

const splash = new SplashScreen();
app.whenReady()
    .then(async () => {
        splash.open({
            text: 'Running startup checks...',
            docker: StatusCheck.LOADING,
            cluster: StatusCheck.LOADING,
        });
        try {
            await checkDockerBinary();
            await checkDockerStatus();
            splash.setStatus({
                docker: StatusCheck.OK,
            });
        } catch (e) {
            splash.setStatus({
                docker: StatusCheck.ERROR,
            });
            throw e;
        }

        try {
            await ensureLocalCluster();
            splash.setStatus({
                cluster: StatusCheck.OK,
            });
        } catch (e) {
            splash.setStatus({
                cluster: StatusCheck.ERROR,
            });
            throw e;
        }
    })
    .then(() => {
        splash.setStatus({ text: 'Launching UI...' });
        return createWindow();
    })
    .then(async () => {
        await refreshTray();
        app.on('activate', ensureWindow);
        splash.close();
        app.show();
    })
    .catch((err) => {
        console.error(err);
        // Show a blocking error popup before exiting
        app.focus();
        dialog.showErrorBox('An error occurred during startup', err.stack);
        app.exit(1);
    });
