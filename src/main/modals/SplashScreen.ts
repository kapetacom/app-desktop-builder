import { BrowserWindow } from 'electron';
import { hasApp } from '@kapeta/nodejs-process';
import { attachIPCListener, getPreloadScript, resolveHtmlPath } from '../helpers';
import { ClusterService } from '../services/ClusterService';

export class SplashScreen {
    private win: BrowserWindow | null = null;

    private clusterService: ClusterService;

    private status: any = {};

    constructor(clusterService: ClusterService) {
        this.clusterService = clusterService;
    }

    private async checkNpm() {
        try {
            this.setStatus({
                npmStatus: await hasApp('npm'),
            });
        } catch (e) {
            console.log('Failed to check npm', e);
            this.setStatus({
                npmStatus: false,
            });
        }
    }

    private async startCluster(win: BrowserWindow) {
        try {
            delete this.status.localClusterStatus;
            delete this.status.dockerStatus;
            this.setStatus({});

            if (this.clusterService.isRunning()) {
                await this.clusterService.stop();
                // We need to wait a bit for the port to be released
                await new Promise((resolve) => {
                    setTimeout(resolve, 1000);
                });
            }
            const info = await this.clusterService.start();

            this.setStatus({
                localClusterStatus: !!info,
                dockerStatus: !!info?.dockerStatus,
            });
        } catch (e) {
            console.log('Failed to start cluster service', e);
            win.webContents.send('splash', ['failed', e]);
        }
    }

    private setStatus(status: any) {
        if (!this.win) {
            return;
        }
        this.status = {
            ...this.status,
            ...status,
        };
        this.win.webContents.send('splash', ['changed', this.status]);
    }

    /**
     * Shows splash screen and initializes cluster service
     */
    open() {
        if (this.win) {
            throw new Error('Splash screen is already open');
        }

        this.status = {};

        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
            this.win = new BrowserWindow({
                frame: false,
                alwaysOnTop: true,
                transparent: process.platform === 'darwin',
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
                        case 'quit':
                            process.exit();
                            break;
                        case 'retry':
                            await this.performTests(this.win!);
                            break;
                    }
                });

                await this.performTests(this.win);
            } catch (e) {
                reject(e);
            }
        });
    }

    private async performTests(win: BrowserWindow) {
        this.setStatus({});
        await Promise.allSettled([this.checkNpm(), this.startCluster(win)]);
    }

    close() {
        this.win?.destroy();
        this.win = null;
    }
}
