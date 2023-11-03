/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BlockTypeProvider } from '@kapeta/ui-web-context';
import { BlockDefinition, Plan } from '@kapeta/schemas';
import { Asset, SchemaKind } from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import _ from 'lodash';

import useSWRImmutable from 'swr/immutable';
import { useAsyncRetry } from 'react-use';
import { AssetInfo, fromAsset } from '@kapeta/ui-web-plan-editor';
import { SocketService } from 'renderer/api/SocketService';
import { AssetService } from 'renderer/api/AssetService';

interface AssetChangedEvent {
    type: string;
    sourceOfChange: 'user' | 'filesystem';
    definition: SchemaKind;
    asset: {
        handle: string;
        name: string;
        version: string;
    };
}

const ASSET_CHANGED_EVENT = 'asset-change';

export interface AssetListResult<T = SchemaKind> {
    loading: boolean;
    refresh: () => Promise<void>;
    data: AssetInfo<T>[];
}

export interface AssetResult<T = SchemaKind> {
    loading: boolean;
    data?: AssetInfo<T>;
    invalidate: () => void;
}

export const onAssetChanged = (callback: (evt: AssetChangedEvent) => void) => {
    SocketService.on(ASSET_CHANGED_EVENT, callback);
    return () => {
        SocketService.off(ASSET_CHANGED_EVENT, callback);
    };
};

export const useAssetsChanged = (handler: (evt: AssetChangedEvent) => void, dependencies: any[]) => {
    const callback = useCallback(handler, dependencies);

    useEffect(() => {
        return onAssetChanged(callback);
    }, [callback]);
};

export const useLocalAssets = <T = SchemaKind>(...kinds: string[]): AssetListResult<T> => {
    const [assets, setAssets] = useState<AssetInfo<T>[]>([]);
    const [loading, setLoading] = useState(true);
    const assetResults = useSWRImmutable('local-assets', async () => {
        try {
            return await AssetService.list();
        } catch (e: any) {
            console.warn('Failed to load assets', e);
        }
    });

    const data = useMemo(() => {
        if (!assetResults.data) {
            return [];
        }

        if (!kinds || kinds.length === 0) {
            return assetResults.data.filter((a) => !!a).map(fromAsset);
        }
        return assetResults.data
            .filter((a) => !!a)
            .map(fromAsset)
            .filter((asset) => {
                return kinds.includes(asset.content.kind.toLowerCase());
            }) as AssetInfo<T>[];
    }, [assetResults.data, kinds.join(':')]);

    const callback = useCallback(
        async (evt: AssetChangedEvent) => {
            if (!evt?.asset) {
                return;
            }
            if (kinds.length > 0 && !kinds.includes(evt.definition.kind.toLowerCase())) {
                return;
            }
            try {
                await assetResults.mutate();
            } catch (e) {
                console.warn('Failed to reload assets', e);
            }
        },
        [assetResults]
    );

    useEffect(() => {
        return onAssetChanged(callback);
    }, [callback]);

    useEffect(() => {
        if (assetResults.isLoading) {
            return;
        }
        // We only want to show loading on initial load
        // Otherwise we do a replace
        setLoading(false);
        setAssets((prev) => {
            return data.map((asset) => {
                const assetUri = parseKapetaUri(asset.ref);
                const identical = prev.find((a) => {
                    return parseKapetaUri(a.ref).equals(assetUri) && _.isEqual(a, asset);
                });

                if (identical) {
                    return identical;
                }

                return asset as AssetInfo<T>;
            });
        });
    }, [assetResults.isLoading, data]);
    return {
        data: assets,
        loading,
        refresh: async () => {
            await assetResults.mutate();
        },
    };
};

export const usePlans = () => {
    return useLocalAssets<Plan>('core/plan');
};

export const useBlocks = () => {
    const all = useLocalAssets<BlockDefinition>();
    const data = useMemo(() => {
        return all.data.filter((asset) => {
            return BlockTypeProvider.exists(asset.content.kind);
        });
    }, [all.data]);

    return {
        data,
        loading: all.loading,
    };
};

export const useAsset = <T = SchemaKind>(ref: string, ensure?: boolean): AssetResult<T> => {
    if (ensure === undefined) {
        ensure = false;
    }
    const assetResult = useAsyncRetry(async () => {
        try {
            const asset = await AssetService.get(ref, ensure);
            if (!asset) {
                return undefined;
            }
            return fromAsset(asset as Asset<T>);
        } catch (e: any) {
            console.warn('Failed to load assets', e);
        }
    }, [ref, ensure]);

    useEffect(() => {
        const uri = parseKapetaUri(ref);
        const handler = async (evt: AssetChangedEvent) => {
            if (!evt?.asset) {
                return;
            }

            if (evt.sourceOfChange === 'user') {
                // We don't want to reload if the user changed the asset
                return;
            }
            try {
                if (
                    evt.asset.name === uri.name &&
                    evt.asset.handle === uri.handle &&
                    evt.asset.version === uri.version
                ) {
                    await assetResult.retry();
                }
            } catch (e) {
                console.warn(`Failed to reload asset: ${ref}`, e, evt);
            }
        };
        SocketService.on(ASSET_CHANGED_EVENT, handler);
        return () => {
            SocketService.off(ASSET_CHANGED_EVENT, handler);
        };
    }, [assetResult, ref]);

    return {
        data: assetResult.value,
        loading: assetResult.loading,
        invalidate: useCallback(() => {
            assetResult.retry();
        }, [assetResult]),
    };
};
