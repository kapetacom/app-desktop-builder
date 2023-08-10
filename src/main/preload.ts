import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import ClusterConfiguration from '@kapeta/local-cluster-config';
import { version } from '../../package.json';

export type Channels = 'ipc-main' | 'splash' | 'processing' | 'auth';
export type Procedures = 'get-token' | 'get-contexts' | 'log-out' | 'refresh-context' | 'set-context';

const electronHandler = {
    ipcRenderer: {
        sendMessage(channel: Channels, args: unknown[]) {
            ipcRenderer.send(channel, args);
        },
        on(channel: Channels, func: (...args: unknown[]) => void) {
            const subscription = (
                _event: IpcRendererEvent,
                ...args: unknown[]
            ) => func(...args);
            ipcRenderer.on(channel, subscription);

            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        },
        once(channel: Channels, func: (...args: unknown[]) => void) {
            ipcRenderer.once(channel, (_event, ...args) => func(...args));
        },
        invoke(channel: Procedures, ...args: any[]) {
            return ipcRenderer.invoke(channel, ...args);
        },
    },
};

contextBridge.exposeInMainWorld('electron', electronHandler);
const kapetaDesktop = {
    version,
    urls: {
        deployments: 'https://web-deployments.kapeta.com',
        settings: 'https://web-identity-provider.kapeta.com',
    },
    cluster_service: {
        url: ClusterConfiguration.getClusterServiceAddress(),
    },
};

contextBridge.exposeInMainWorld('KapetaDesktop', kapetaDesktop);

export type KapetaDesktop = typeof kapetaDesktop;
export type ElectronHandler = typeof electronHandler;
