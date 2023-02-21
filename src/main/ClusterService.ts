import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

const { fork } = require('child_process');
const Path = require('path');
const FS = require('fs');

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

    private running: boolean = false;

    private child?: ChildProcess = undefined;

    public async start(): Promise<ClusterInfo> {
        console.log('Starting cluster service from %s', SERVICE_FILE);
        return new Promise((resolve, reject) => {
            const child = (this.child = fork(SERVICE_FILE));
            child.on('message', (msg) => {
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
