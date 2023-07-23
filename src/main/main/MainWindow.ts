import { BrowserWindow, shell } from 'electron';
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
                nodeIntegration: false,
                contextIsolation: true,
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
    }
}