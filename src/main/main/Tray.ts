import {
    app,
    dialog,
    Menu,
    MenuItemConstructorOptions,
    shell,
    Tray,
    nativeTheme,
} from 'electron';
import {ExtendedIdentity, KapetaAPI, Membership} from '@kapeta/nodejs-api-client';
import {createFuture, getAssetPath, ensureCLI, hasApp} from '../helpers';
import {ClusterService} from '../services/ClusterService';
import {MainWindow} from './MainWindow';
import {ModalProcessing} from '../modals/ModalProcessing';

import MenuItem = Electron.MenuItem;
import {MemberIdentity} from "@kapeta/ui-web-types";
import {spawn} from "@kapeta/nodejs-process";

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
        let userMenu = await this.createUserMenu();

        const menuItems: Array<TrayMenuItem> = [
            {
                label: 'Dashboard',
                click: () => this.mainWindow.show(),
            },
            ...userMenu,
            {type: 'separator'},
            {
                label: 'Open Kapeta Cloud',
                click: () => shell.openExternal('https://app.kapeta.com')
            },
            {type: 'separator'},
            ...await this.createCLIMenu(),
            {label: 'Quit Kapeta', click: () => app.quit()},
        ];

        const contextMenu = Menu.buildFromTemplate(menuItems);
        this.tray.setContextMenu(contextMenu);
    }

    private async createCLIMenu():Promise<TrayMenuItem[]> {
        if (await this.hasCLI()) {
            return [];
        }

        return [
            {
                label: 'Install Kapeta Command Line Tool',
                click: () => this.installCLI()
            },
            {type: 'separator'},
        ]
    }

    private async createUserMenu(): Promise<TrayMenuItem[]> {
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
                            click: () => this.showAccountSettings(identity),
                        },
                        {
                            label: 'Sign out',
                            click: () => this.signOut(),
                        },
                    ],
                },
            ];

            if (memberships.length > 0) {
                userMenu.push(
                    this.createMembershipMenu(context, memberships)
                );
            }
            return userMenu;
        } catch (e) {
            return [
                {
                    label: 'Sign in',
                    click: () => this.signIn()
                },
            ];
        }
    }

    private showAccountSettings(identity: ExtendedIdentity) {
        return () => {
            shell.openExternal(
                `${this.api.getBaseUrl()}/${
                    identity.handle
                }/iam`
            );
        };
    }

    private signOut() {
        return async () => {
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
        };
    }

    private createMembershipMenu(context: MemberIdentity | null, memberships: Membership[]) {
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
                click: () => this.selectContext(membership),
            });
        });

        if (context) {
            contextMenus.push({
                label: 'Remove context',
                click: () => this.removeContext(),
            });
        }
        return membershipMenu;
    }

    private async selectContext(membership: Membership) {
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
    }

    private async signIn() {
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
    }

    private async removeContext() {
        try {
            await this.api.removeContext();
            await this.update();
        } catch (e) {
            dialog.showErrorBox(
                'Failed to remove context',
                e.message
            );
        }
    }

    private async hasCLI() {
        return await hasApp('kap');
    }

    private async installCLI() {
        const task = await ensureCLI();
        if (!task) {
            return;
        }

        await this.processingModal.open(
            this.mainWindow.window,
            {
                title: 'Installing Kapeta CLI',
                text: `Please wait while we're installing the kapeta command line tool...`,
            }
        );

        const onCloseHandler = async () => {
            task.abort();
            dialog.showErrorBox(
                'Installation aborted',
                'The installation of the Kapeta CLI was aborted. '
            );
        };

        this.processingModal.once('close', onCloseHandler);

        try {
            await task.wait();

            dialog.showMessageBoxSync({
                type: 'info',
                message: `You now have the Kapeta CLI available as "kap" in your terminal`,
                title: 'Installation succeeded',
            });
        } catch (e) {
            if (e.code === 'ABORTED') {
                return;
            }

            console.warn('Failed to install CLI', e);
            dialog.showErrorBox(
                'Installation failed',
                'The installation failed. Please try again. '
            );
        } finally {
            this.processingModal.off('close', onCloseHandler);
            this.processingModal.close();
        }

    }
}
