import { BrowserWindow } from 'electron';
import { attachIPCListener, getPreloadScript, resolveHtmlPath } from '../helpers';
import { ClusterService } from '../services/ClusterService';
import { hasApp } from '@kapeta/nodejs-process';
import { extract } from 'tar-stream';
import FS from 'fs-extra';
import Path from 'node:path';
import request from 'request';
import gunzip from 'gunzip-maybe';
import ClusterConfiguration from '@kapeta/local-cluster-config';

const DEFAULT_PROVIDERS_URL = 'https://storage.googleapis.com/kapeta-production-cdn/archives/default-providers.tar.gz';

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
                await new Promise((resolve) => setTimeout(resolve, 1000));
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
        await this.checkForDefault();
        await Promise.allSettled([this.checkNpm(), this.startCluster(win)]);
    }

    private async checkForDefault() {
        const definitions = ClusterConfiguration.getDefinitions();
        if (definitions.length < 1) {
            try {
                await this.installDefaults();
            } catch (e) {
                console.warn('Failed to install defaults', e);
            }
        }
    }

    private async installDefaults() {
        const repoBase = ClusterConfiguration.getRepositoryBasedir();

        return new Promise<void>((resolve, reject) => {
            const extractor = extract();
            const dirCache = new Set<string>();
            extractor.on('entry', async function (header, stream, next) {
                if (header.type !== 'file') {
                    stream.on('end', function () {
                        next(); // ready for next entry
                    });
                    stream.resume(); // just auto drain the stream
                    return;
                }

                try {
                    const dirname = Path.join(repoBase, Path.dirname(header.name));
                    if (!dirCache.has(dirname)) {
                        let dirExists = false;
                        try {
                            await FS.stat(dirname);
                            dirExists = true;
                        } catch (e) {}
                        if (!dirExists) {
                            await FS.mkdirp(dirname);
                        }
                        dirCache.add(dirname);
                    }
                    const fileTarget = Path.join(repoBase, header.name);
                    stream.on('error', (err) => {
                        reject(err);
                    });
                    stream.on('end', next);

                    stream.pipe(
                        FS.createWriteStream(fileTarget, {
                            mode: header.mode,
                        })
                    );
                } catch (e) {
                    reject(e);
                }
            });

            extractor.on('finish', function () {
                // all entries done - lets finalize it
                console.log('Default providers installed');
                resolve();
            });

            extractor.on('error', function (err) {
                reject(err);
            });

            console.log('Downloading default providers from %s', DEFAULT_PROVIDERS_URL);
            const response = request(DEFAULT_PROVIDERS_URL);
            response.on('error', function (err) {
                reject(err);
            });
            response.pipe(gunzip()).pipe(extractor);
        });
    }

    close() {
        this.win?.destroy();
        this.win = null;
    }
}
