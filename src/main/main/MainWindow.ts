import { BrowserWindow } from 'electron';
import {
    getAssetPath,
    getPreloadScript,
    resolveHtmlPath,
    WindowOpenHandler,
} from '../helpers';
import { MenuBuilder } from './MenuBuilder';
import { DockWrapper } from './Dock';
import { TrayWrapper } from './Tray';
import { ClusterService } from '../services/ClusterService';

export class MainWindow {
    private _window: BrowserWindow | undefined = undefined;
    private tray: TrayWrapper;
    private dock: DockWrapper;
    private clusterService: ClusterService;

    constructor(clusterService: ClusterService) {
        this.dock = new DockWrapper();
        this.tray = new TrayWrapper(this, clusterService);
        this.clusterService = clusterService;
    }

    public get window() {
        return this._window;
    }

    public hide() {
        if (this._window?.hide) {
            this._window?.hide();
        }
    }

    public close() {
        if (!this._window) {
            return;
        }

        if (this._window.close) {
            this._window.close();
        } else {
            this._window.destroy();
        }
    }

    public async open() {
        if (this._window) {
            this._window.show();
            return;
        }

        await this.dock.show();
        this._window = new BrowserWindow({
            show: false,
            icon: getAssetPath('icon.png'),
            webPreferences: {
                preload: getPreloadScript(),
                nodeIntegration: true,
                contextIsolation: true,
                nodeIntegrationInSubFrames: true,
            },
        });

        this._window.maximize();

        await this.tray.update();

        const localClusterInfo = this.clusterService.getInfo();
        const clusterServiceURL = localClusterInfo
            ? encodeURIComponent(
                  `http://${localClusterInfo.host}:${localClusterInfo.port}`
              )
            : '';

        await this._window.loadURL(
            `${resolveHtmlPath(
                `index.html`
            )}?cluster_service=${clusterServiceURL}`
        );

        this._window.on('show', () => this.dock.show());

        this._window.on('ready-to-show', async () => {
            if (!this._window) {
                throw new Error('"this.window" is not defined');
            }
            this._window.show();
        });

        this._window.on('closed', async () => {
            this._window = undefined;
            this.dock.hide();
            await this.tray.update();
        });

        const menuBuilder = new MenuBuilder(this._window);
        menuBuilder.buildMenu();

        // Open urls in the user's browser
        this._window.webContents.setWindowOpenHandler(WindowOpenHandler);

        // Hack the cookies to make iframes work with cookies
        // Sets all cookies to SameSite=None; secure=true
        this._window.webContents.session.webRequest.onHeadersReceived(
            {
                urls: ['https://*.kapeta.com/*'],
            },
            (details, callback) => {
                const cookieHeader =
                    details.responseHeaders &&
                    Object.keys(details.responseHeaders).find(
                        (k) => k.toLowerCase() === 'set-cookie'
                    );
                if (cookieHeader) {
                    details.responseHeaders![cookieHeader] =
                        details.responseHeaders![cookieHeader].map((cookie) => {
                            return `${cookie.replace(
                                /samesite=[^;]+(;|\s*$)/gi,
                                ''
                            )}; SameSite=none; secure=true`;
                        });
                }

                callback({
                    cancel: false,
                    responseHeaders: details.responseHeaders,
                });
            }
        );
    }

    async show() {
        if (!this.window) {
            return this.open();
        }

        if (this.isMinimized()) {
            this.restore();
        }
        this.focus();
    }

    isMinimized() {
        return this.window?.isMinimized();
    }

    restore() {
        this.window?.restore();
    }

    focus() {
        this.window?.focus();
    }

    update() {
        return this.tray.update()
    }
}
