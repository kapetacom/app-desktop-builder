import {BrowserWindow, ipcMain} from 'electron';
import {attachIPCListener, getPreloadScript, resolveHtmlPath} from '../helpers';
import {ClusterService} from "../services/ClusterService";

export class SplashScreen {
    private win: BrowserWindow | null = null;
    private clusterService: ClusterService;

    constructor(clusterService: ClusterService) {
        this.clusterService = clusterService;
    }

    private async startCluster(win: BrowserWindow) {
        try {
            win.webContents.send('splash', ['start']);

            if (this.clusterService.isRunning()) {
                await this.clusterService.stop();
                // We need to wait a bit for the port to be released
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            const info = await this.clusterService.start();
            win.webContents.send('splash', ['changed', info]);
        } catch (e) {
            console.log('Failed to start cluster service', e);
            win.webContents.send('splash', ['failed', e]);
        }
    }

    /**
     * Shows splash screen and initializes cluster service
     */
    open() {
        if (this.win) {
            throw new Error('Splash screen is already open');
        }

        return new Promise<void>(async (resolve, reject) => {
            this.win = new BrowserWindow({
                frame: false,
                alwaysOnTop: true,
                transparent: true,
                center: true,
                modal: true,
                width: 516,
                height: 316,
                hiddenInMissionControl: true,
                resizable: false,
                webPreferences: {
                    preload: getPreloadScript(),
                    devTools: false,
                    nodeIntegration: true,
                    contextIsolation: true,
                },
            });
            try {
                await this.win.loadURL(resolveHtmlPath('splash.html'));
                this.win.center();

                attachIPCListener(this.win, 'splash', async (event, [type]) => {
                    switch (type) {
                        case 'close':
                            this.close();
                            resolve();
                            break;
                        case 'restart-cluster':
                        case 'recheck-docker':
                            await this.startCluster(this.win!);
                            break;
                    }
                });

                await this.startCluster(this.win);

            } catch (e) {
                reject(e);
            }
        })
    }

    close() {
        this.win?.destroy();
        this.win = null;
    }
}
