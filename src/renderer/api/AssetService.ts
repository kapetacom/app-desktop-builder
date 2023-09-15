import { EventEmitter } from 'events';

import { Asset, SchemaKind } from '@kapeta/ui-web-types';

import YAML from 'yaml';
import { AssetListener, AssetStore, simpleFetch } from '@kapeta/ui-web-context';
import { clusterPath } from './ClusterConfig';
import { SocketService } from './SocketService';

class AssetServiceImpl extends EventEmitter implements AssetStore {
    async list(): Promise<Asset[]> {
        return simpleFetch(clusterPath(`/assets/`));
    }

    async get(ref: string, ensure = true): Promise<Asset> {
        return simpleFetch(clusterPath(`/assets/read`, { ref, ensure: String(ensure) }));
    }

    async import(ref: string): Promise<Asset[]> {
        const out = await simpleFetch(clusterPath(`/assets/import`, { ref }), {
            method: 'PUT',
        });

        this.emit('change');
        return out;
    }

    async create(path: string, content: SchemaKind): Promise<Asset[]> {
        const out = await simpleFetch(clusterPath(`/assets/create`, { path }), {
            headers: {
                'Content-Type': 'application/yaml',
            },
            body: YAML.stringify(content),
            method: 'POST',
        });

        this.emit('change');

        return out;
    }

    async update(ref: string, content: SchemaKind) {
        await simpleFetch(clusterPath(`/assets/update`, { ref }), {
            headers: {
                'Content-Type': 'application/yaml',
            },
            body: YAML.stringify(content),
            method: 'PUT',
        });

        this.emit('change');
    }

    async remove(ref: string): Promise<void> {
        await simpleFetch(clusterPath(`/assets/`, { ref }), {
            method: 'DELETE',
        });

        this.emit('change');
    }

    /**
     * Installs the asset with the given ref
     *
     * @returns A list of task ids
     */
    async install(ref: string): Promise<string[]> {
        const result = await simpleFetch(clusterPath(`/assets/install`, { ref }), {
            method: 'PUT',
        });

        this.emit('change');

        return result;
    }

    /**
     * Subscribes to whenever providers with a web UI is added / removed (not blocks, plans etc)
     * This is to allow the UI to react to such events.
     *
     * @param handler
     */
    subscribe(handler: AssetListener) {
        SocketService.joinRoom('assets');
        SocketService.on('changed', handler);

        return () => {
            this.unsubscribe(handler);
        };
    }

    private unsubscribe(handler: AssetListener) {
        SocketService.leaveRoom('assets');
        SocketService.off('changed', handler);
    }
}

export const AssetService = new AssetServiceImpl();
