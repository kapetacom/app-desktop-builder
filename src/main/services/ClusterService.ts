import { ChildProcess, fork } from 'node:child_process';
import { EventEmitter } from 'node:events';

import Path from 'node:path';
import FS from 'node:fs';

export interface ClusterInfo {
    host: string;
    port: number;
    dockerStatus: boolean;
}

const SERVICE_FILE = Path.resolve(__dirname, '../../service/index.js');

export class ClusterService extends EventEmitter {
    private info: ClusterInfo | null = null;

    constructor() {
        super();
        if (!FS.existsSync(SERVICE_FILE)) {
            throw new Error(`Service file not found: ${SERVICE_FILE}`);
        }
    }

    private running = false;

    private child?: ChildProcess = undefined;

    public async start(): Promise<ClusterInfo> {
        if (this.child) {
            throw new Error('Cluster service is already running');
        }
        console.log('Starting cluster service from %s', SERVICE_FILE);
        return new Promise((resolve, reject) => {
            const child = (this.child = fork(SERVICE_FILE));
            child.on('message', (msg: ClusterInfo) => {
                this.running = true;
                this.info = msg;
                this.emit('started', msg);
                console.log(
                    'Cluster service listening on %s:%s ',
                    msg.host,
                    msg.port
                );
                resolve(msg);
            });
            child.on('error', (err) => {
                this.stop();
                reject(err);
            });
            child.on('exit', (exitCode: number) => {
                if (exitCode !== null && exitCode !== 0) {
                    reject(
                        new Error(`Process exited with exitCode: ${exitCode}.`)
                    );
                }
                this.stop();
            });
        });
    }

    public getInfo(): ClusterInfo | null {
        return this.info;
    }

    public async stop() {
        if (this.child) {
            this.child.kill('SIGABRT');
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
