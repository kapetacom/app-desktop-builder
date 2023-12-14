/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { ChildProcess, fork } from 'node:child_process';
import { EventEmitter } from 'node:events';
import ClusterConfiguration from '@kapeta/local-cluster-config';
import request from 'request';
import Path from 'node:path';
import FS from 'node:fs';
import { app } from 'electron';
import { getEnv } from '../baseUrl';

export interface ClusterInfo {
    host: string;
    port: number;
    dockerStatus: boolean;
}

const SERVICE_FILE = app.isPackaged
    ? Path.resolve(__dirname, '../service/index.js') //Relative to main.js - the entry point of the app
    : Path.resolve(__dirname, '../../service/index.js');

export class ClusterService extends EventEmitter {
    private info: ClusterInfo | null = null;
    private stoppedIntentionally: boolean = false;

    constructor() {
        super();
        if (!FS.existsSync(SERVICE_FILE)) {
            throw new Error(`Service file not found: ${SERVICE_FILE}`);
        }
    }

    private running = false;

    private child?: ChildProcess = undefined;

    private async checkClusterStatus(): Promise<ClusterInfo> {
        const clusterAddress = ClusterConfiguration.getClusterServiceAddress();
        if (!clusterAddress) {
            throw new Error('No cluster service address found');
        }

        return new Promise((resolve, reject) => {
            request.get(clusterAddress + '/status', (err, res, body) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (res.statusCode !== 200) {
                    reject(new Error(`Unexpected status code: ${res.statusCode}`));
                    return;
                }

                const status = JSON.parse(body);

                resolve({
                    host: ClusterConfiguration.getClusterServiceHost(),
                    port: parseInt(ClusterConfiguration.getClusterServicePort()),
                    dockerStatus: status.dockerStatus,
                });
            });
        });
    }

    public async start(): Promise<ClusterInfo> {
        this.stoppedIntentionally = false;
        if (this.child) {
            throw new Error('Cluster service is already running');
        }

        try {
            const clusterStatus = await this.checkClusterStatus();
            this.running = true;
            this.info = clusterStatus;
            this.emit('started', this.info);
            console.log('Cluster service already listening on %s:%s ', clusterStatus.host, clusterStatus.port);
            return this.info;
        } catch (err) {
            console.debug('Cluster service was not already running...');
        }

        console.log('Starting cluster service from %s', SERVICE_FILE);
        return new Promise((resolve, reject) => {
            const child = (this.child = fork(SERVICE_FILE, {
                stdio: 'pipe',
                env: {
                    ...process.env,
                    // Used to toggle between staging and prod mode
                    KAP_ENV: getEnv(),
                },
            }));

            child.stdout?.pipe(process.stdout);
            child.stderr?.pipe(process.stderr);

            console.log('Cluster service started with PID: %s', child.pid);
            child.on('message', (msg: ClusterInfo) => {
                this.running = true;
                this.info = msg;
                this.emit('started', msg);
                console.log('Cluster service listening on %s:%s ', msg.host, msg.port);
                resolve(msg);
            });
            child.on('error', (err) => {
                this.stopProcess();
                reject(err);
            });
            child.on('exit', (exitCode: number) => {
                console.log('Cluster service exited with code: %s', exitCode);
                if (exitCode !== null && exitCode !== 0) {
                    reject(new Error(`Process exited with exitCode: ${exitCode}.`));
                }
                this.stopProcess();
                if (!this.stoppedIntentionally) {
                    this.start();
                }
            });
        });
    }

    public getInfo(): ClusterInfo | null {
        return this.info;
    }

    public stop() {
        this.stoppedIntentionally = true;
        this.stopProcess();
    }

    private stopProcess() {
        if (this.child) {
            try {
                this.child.kill('SIGABRT');
            } catch (err) {
                console.error('Failed to kill cluster service process: %s', err);
            }
        }
        this.info = null;
        this.running = false;
        this.child = undefined;
        this.emit('stopped');
    }

    public isRunning(): boolean {
        return this.running;
    }
}
