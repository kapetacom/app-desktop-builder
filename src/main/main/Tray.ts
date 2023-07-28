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

export class TrayWrapper {
    private tray: Tray;
    private api = new KapetaAPI();
    private mainWindow: MainWindow;
    private processingModal: ModalProcessing;
    private clusterService: ClusterService;

    constructor(mainWindow: MainWindow, clusterService: ClusterService) {
        this.mainWindow = mainWindow;
        this.tray = new Tray(
            nativeTheme.shouldUseDarkColors
                ? getAssetPath('icons/tray_icon_dark.png')
                : getAssetPath('icons/tray_icon_light.png')
        );
        this.tray.setToolTip('Kapeta Desktop');
        this.processingModal = new ModalProcessing();
        this.clusterService = clusterService;
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
                                this.api.removeToken();
                                await this.update();
                                this.mainWindow.window?.webContents.send(
                                    'auth',
                                    'signed-out'
                                );
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
                            await this.api.switchContextTo(
                                membership.identity.handle
                            );
                            await this.update();
                        },
                    });
                });

                if (context) {
                    contextMenus.push({
                        label: 'Remove context',
                        click: async () => {
                            await this.api.removeContext();
                            await this.update();
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
                                    text: 'Signing in...',
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
                                            text: 'Continue signing in, in your browser...',
                                            linkText: 'Continue in browser',
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
