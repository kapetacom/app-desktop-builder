/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Plan } from '@kapeta/schemas';
import { Asset } from '@kapeta/ui-web-types';

import { AssetService } from './AssetService';

export const PlannerService = {
    async list(): Promise<Asset<Plan>[]> {
        const assets = await AssetService.list();
        return assets.filter((asset) => {
            return asset.exists && asset.kind.toLowerCase() === 'core/plan'.toLowerCase();
        });
    },
    async get(ref: string): Promise<Asset<Plan>> {
        return AssetService.get(ref);
    },
};
