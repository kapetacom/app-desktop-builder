/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { RESTService, ErrorHandler } from '@kapeta/web-microfrontend/browser';
import { showToasty, ToastType, AssetDisplay } from '@kapeta/ui-web-components';
import { clusterPath } from './ClusterConfig';

const errorHandler: ErrorHandler = (error) => {
    showToasty({
        title: 'Request failed',
        message: error,
        type: ToastType.DANGER,
    });
};

export interface AssetFilter {
    type: 'kind' | 'dependency' | 'public';
    value: string;
}

class RegistryAPI extends RESTService {
    constructor() {
        super(clusterPath('/api/registry'));
        this.withErrorHandler(errorHandler);
    }

    async list(filters?: AssetFilter[]) {
        const params = new URLSearchParams();
        if (filters) {
            for (const filter of filters) {
                params.append('filter', filter.type + '=' + filter.value);
            }
        }
        return this.get<AssetDisplay[]>(`/v1/registry/${filters ? '?' + params.toString() : ''}`);
    }

    async findByHandle(handle: string) {
        return this.get<AssetDisplay[]>(`/v1/registry/${encodeURIComponent(handle)}`);
    }

    async getAsset(name: string, version: string) {
        const [handle, assetName] = name.split('/');
        return this.get<AssetDisplay>(
            `/v1/registry/${encodeURIComponent(handle)}/${encodeURIComponent(assetName)}/${encodeURIComponent(version)}`
        );
    }

    async getCurrentAsset(name: string) {
        return this.getAsset(name, 'current');
    }

    async getAssetVersions(name: string) {
        const [handle, assetName] = name.split('/');
        return this.get<AssetDisplay[]>(`/v1/registry/${encodeURIComponent(handle)}/${encodeURIComponent(assetName)}`);
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

export const assetFetcher = async (name: string, version: string) =>
    api
        .registry()
        .getAsset(name, version)
        .then((res) => {
            return res;
        });
