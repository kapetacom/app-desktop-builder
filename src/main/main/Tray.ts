import {
    app,
    dialog,
    Menu,
    MenuItemConstructorOptions,
    shell,
    Tray,
    nativeTheme,
} from 'electron';
import { KapetaAPI } from '@kapeta/nodejs-api-client';
import { createFuture, getAssetPath } from '../helpers';
import { ClusterService } from '../services/ClusterService';
import { MainWindow } from './MainWindow';
import { ModalProcessing } from '../modals/ModalProcessing';

import MenuItem = Electron.MenuItem;

type TrayMenuItem = MenuItemConstructorOptions | MenuItem;

//Always use system theme
nativeTheme.themeSource = 'system';

const getTrayIcon = () => {
    if (process.platform === 'darwin') {
        // macOS tray is always dark so need light to be visible
        return getAssetPath('icons/tray_icon_light.png')
    }

    return nativeTheme.shouldUseDarkColors
        ? getAssetPath('icons/tray_icon_light.png')
        : getAssetPath('icons/tray_icon_dark.png')
}

export class TrayWrapper {
    private tray: Tray;
    private api = new KapetaAPI();
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
        })
    }

    public async update() {
        let userMenu: TrayMenuItem[];

        try {
            const identity = await this.api.getCurrentIdentity();
            const context = await this.api.getCurrentContext();
            const memberships = await this.api.getCurrentMemberships();
            userMenu = [
                {
                    type: 'submenu',
                    label: identity.name || identity.handle,
                    submenu: [
                        {
                            label: 'Account Settings',
                            click: () => {
                                shell.openExternal(
                                    `${this.api.getBaseUrl()}/${
                                        identity.handle
                                    }/iam`
                                );
                            },
                        },
                        {
                            label: 'Sign out',
                            click: async () => {
                                try {
                                    this.api.removeToken();
                                    await this.update();
                                    this.mainWindow.window?.webContents.send(
                                        'auth',
                                        'signed-out'
                                    );
                                } catch (e) {
                                    dialog.showErrorBox(
                                        'Failed to sign out',
                                        e.message
                                    );
                                }
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
                        context &&
                        context.identity.id === membership.identity.id
                    );
                    if (isCurrent) {
                        return;
                    }

                    const label = membership.identity.name;
                    contextMenus.push({
                        label,
                        click: async () => {
                            try {
                                await this.api.switchContextTo(
                                    membership.identity.handle
                                );
                                await this.update();
                            } catch (e) {
                                dialog.showErrorBox(
                                    'Failed to switch context',
                                    e.message
                                );
                            }
                        },
                    });
                });

                if (context) {
                    contextMenus.push({
                        label: 'Remove context',
                        click: async () => {
                            try {
                                await this.api.removeContext();
                                await this.update();
                            } catch (e) {
                                dialog.showErrorBox(
                                    'Failed to remove context',
                                    e.message
                                );
                            }
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
                            const future = createFuture();
                            await this.processingModal.open(
                                this.mainWindow.window,
                                {
                                    title: 'Signing in...',
                                    text: `We are signing you in to Kapeta in your browser.
                                            This will log you in to your Kapeta account.
                                            Cancelling will abort the process.`,
                                }
                            );

                            this.processingModal.once('close', async () => {
                                future.reject(
                                    new Error('Sign in was cancelled')
                                );
                            });

                            this.api
                                .doDeviceAuthentication({
                                    onVerificationCode: (url: string) => {
                                        this.processingModal.setProps({
                                            title: 'Signing in...',
                                            text: `We are signing you in to Kapeta in your browser.
                                                    This will log you in to your Kapeta account.
                                                    Cancelling will abort the process.`,
                                            linkText: 'View browser window',
                                            link: url,
                                        });
                                        shell.openExternal(url);
                                    },
                                })
                                .then(() => {
                                    future.resolve();
                                })
                                .catch((err) => {
                                    future.reject(err);
                                });


                            await future.promise;
                            await this.update();
                            const identity =
                                await this.api.getCurrentIdentity();
                            this.processingModal.close();
                            dialog.showMessageBoxSync({
                                type: 'info',
                                message: `You were signed in as ${
                                    identity.name || identity.handle
                                }!`,
                                title: 'Signed in!',
                            });

                            this.mainWindow.window?.webContents.send(
                                'auth',
                                'signed-in'
                            );
                        } catch (err: any) {
                            this.processingModal.close();
                            const message =
                                err.message ?? err.error ?? 'Unknown error';
                            // Failed to complete
                            dialog.showErrorBox(
                                'Failed to authenticate',
                                message
                            );
                        } finally {
                            this.processingModal.close();
                        }
                    },
                },
            ];
        }

        const isRunning = this.clusterService.isRunning();
        let localClusterInfo = this.clusterService.getInfo();

        const menuItems: Array<TrayMenuItem> = [
            {
                label: isRunning
                    ? `Local cluster: http://${localClusterInfo?.host}:${localClusterInfo?.port}`
                    : 'Local cluster is not running',
                enabled: false,
            },
            { type: 'separator' },
            {
                label: 'Dashboard',
                click: () => this.mainWindow.open(),
            },
            ...userMenu,
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
        this.tray.setContextMenu(contextMenu);
    }
}
