/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { RESTService } from '@kapeta/web-microfrontend/browser';
import { showToasty, ToastType, AssetDisplay } from '@kapeta/ui-web-components';
import { clusterPath } from './ClusterConfig';

const errorHandler = (error) => {
    showToasty({
        title: 'Request failed',
        message: error,
        type: ToastType.DANGER,
    });
};

class RegistryAPI extends RESTService {
    constructor() {
        super(clusterPath('/api/registry'));
        this.withErrorHandler(errorHandler);
    }

    async list(): Promise<AssetDisplay[]> {
        return this.get('/v1/registry/');
    }

    async findByHandle(handle: string): Promise<AssetDisplay[]> {
        return this.get(`/v1/registry/${encodeURIComponent(handle)}`);
    }

    async getAsset(name: string, version: string): Promise<AssetDisplay> {
        const [handle, assetName] = name.split('/');
        return this.get(
            `/v1/registry/${encodeURIComponent(handle)}/${encodeURIComponent(assetName)}/${encodeURIComponent(version)}`
        );
    }

    async getCurrentAsset(name: string): Promise<AssetDisplay> {
        return this.getAsset(name, 'current');
    }

    async getAssetVersions(name: string): Promise<AssetDisplay[]> {
        const [handle, assetName] = name.split('/');
        return this.get(`/v1/registry/${encodeURIComponent(handle)}/${encodeURIComponent(assetName)}`);
    }
}

export class APIService {
    private _registry: RegistryAPI;

    constructor() {
        this._registry = new RegistryAPI();
    }

    public registry(): RegistryAPI {
        return this._registry;
    }
}

export const api = new APIService();

export const assetFetcher = (name: string, version: string) => api.registry().getAsset(name, version);
