import { app, Menu, MenuItemConstructorOptions, shell, Tray, nativeTheme } from 'electron';
import { ExtendedIdentity, KapetaAPI, Membership } from '@kapeta/nodejs-api-client';
import { createFuture, getAssetPath, showError, showInfo, appVersion } from '../helpers';
import { ClusterService } from '../services/ClusterService';
import { MainWindow } from './MainWindow';
import { ModalProcessing } from '../modals/ModalProcessing';

import MenuItem = Electron.MenuItem;
import { MemberIdentity } from '@kapeta/ui-web-types';

type TrayMenuItem = MenuItemConstructorOptions | MenuItem;

//Always use system theme
nativeTheme.themeSource = 'system';

const getTrayIcon = () => {
    if (nativeTheme.shouldUseDarkColors) {
        return getAssetPath('icons/tray_icon_light.png');
    }
    return getAssetPath('icons/tray_icon_dark.png');
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
        let userMenu = await this.createUserMenu();

        const menuItems: Array<TrayMenuItem> = [
            {
                label: 'Dashboard',
                click: () => this.mainWindow.show(),
            },
            ...userMenu,
            { type: 'separator' },
            {
                label: 'Open Kapeta Cloud',
                click: () => shell.openExternal('https://app.kapeta.com'),
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

    private async createUserMenu(): Promise<TrayMenuItem[]> {
        let userMenu: TrayMenuItem[];

        try {
            const api = new KapetaAPI();
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
                userMenu.push(this.createMembershipMenu(context, memberships));
            }
            return userMenu;
        } catch (e) {
            return [
                {
                    label: 'Sign in',
                    click: () => this.signIn(),
                },
            ];
        }
    }

    private showAccountSettings(identity: ExtendedIdentity) {
        const api = new KapetaAPI();
        return () => {
            shell.openExternal(`${api.getBaseUrl()}/${identity.handle}/iam`);
        };
    }

    private async signOut() {
        try {
            const api = new KapetaAPI();
            api.removeToken();
            await this.update();
            this.emitAuthEvent('signed-out');
        } catch (e) {
            showError('Failed to sign out');
        }
    }

    private createMembershipMenu(context: MemberIdentity | null, memberships: Membership[]) {
        const contextMenus: MenuItemConstructorOptions[] = [];
        const membershipMenu: TrayMenuItem = {
            type: 'submenu',
            label: context ? context.identity.name || context.identity.handle : '<no context>',
            submenu: contextMenus,
        };

        memberships.forEach((membership) => {
            const isCurrent = !!(context && context.identity.id === membership.identity.id);
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
            const api = new KapetaAPI();
            await api.switchContextTo(membership.identity.handle);
            this.emitAuthEvent('switched-context');
            await this.update();
        } catch (e) {
            showError(`Failed to switch context: ${e.message}`);
        }
    }

    private async signIn() {
        try {
            const api = new KapetaAPI();
            const future = createFuture();
            await this.processingModal.open(this.mainWindow.window, {
                title: 'Signing in...',
                text: `We are signing you in to Kapeta in your browser.
                                            This will log you in to your Kapeta account.
                                            Cancelling will abort the process.`,
            });

            this.processingModal.once('close', async () => {
                future.reject(new Error('Sign in was cancelled'));
            });

            api.doDeviceAuthentication({
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
            const identity = await api.getCurrentIdentity();
            this.processingModal.close();
            showInfo(`You were signed in as ${identity.name || identity.handle}!`);

            this.emitAuthEvent('signed-in');
        } catch (err: any) {
            this.processingModal.close();
            const message = err.message ?? err.error ?? 'Authentication failed';
            // Failed to complete
            showError(message);
        } finally {
            this.processingModal.close();
        }
    }

    private async removeContext() {
        try {
            const api = new KapetaAPI();
            await api.removeContext();
            this.emitAuthEvent('switched-context');
            await this.update();
        } catch (e) {
            showError(`Failed to remove context: ${e.message}`);
        }
    }
    private emitAuthEvent(message: string) {
        this.mainWindow.window?.webContents.send('auth', message);
    }
}
