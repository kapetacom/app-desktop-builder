import { ChildProcess, fork } from 'node:child_process';
import { EventEmitter } from 'node:events';

import Path from 'node:path';
import FS from 'node:fs';

export interface ClusterInfo {
    host: string;
    port: number;
}

const SERVICE_FILE = Path.resolve(__dirname, '../service/index.js');

export class ClusterService extends EventEmitter {
    constructor() {
        super();
        if (!FS.existsSync(SERVICE_FILE)) {
            throw new Error(`Service file not found: ${SERVICE_FILE}`);
        }
    }

    private running = false;

    private child?: ChildProcess = undefined;

    public async start(): Promise<ClusterInfo> {
        console.log('Starting cluster service from %s', SERVICE_FILE);
        return new Promise((resolve, reject) => {
            const child = (this.child = fork(SERVICE_FILE));
            child.on('message', (msg: ClusterInfo) => {
                this.running = true;
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
            child.on('exit', () => {
                this.stop();
            });
        });
    }

    public async stop() {
        if (this.child) {
            this.child.kill();
        }
        this.running = false;
        this.child = undefined;
        this.emit('stopped');
    }

    public isRunning(): boolean {
        return this.running;
    }
}
