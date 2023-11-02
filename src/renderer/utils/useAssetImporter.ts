/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { showFilePickerOne } from './showFilePicker';
import { AssetStore } from '@kapeta/ui-web-context';
import { showToasty, ToastType } from '@kapeta/ui-web-components';
import { useState } from 'react';
import YAML from 'yaml';
import { normalizeKapetaUri } from './planContextLoader';
import { Asset } from '@kapeta/ui-web-types';

interface Options {
    assetService?: AssetStore;
    allowedKinds?: string[];
}

type AssetType = Asset;

export interface AssetImporter {
    importAsset: () => Promise<AssetType[] | null>;
    loading: boolean;
}

export const useAssetImporter = (opts: Options): AssetImporter => {
    const [loading, setLoading] = useState(false);
    const importAssert = async (): Promise<AssetType[] | null> => {
        if (!opts.assetService) {
            return null;
        }

        setLoading(true);

        const result = await showFilePickerOne({
            title: 'Choose kapeta asset to import',
            filters: [
                {
                    name: 'Kapeta Asset',
                    extensions: ['yml'],
                },
            ],
        });

        if (!result) {
            setLoading(false);
            return null;
        }

        if (opts.allowedKinds && opts.allowedKinds.length > 0) {
            let parsedContent: any = null;
            try {
                parsedContent = YAML.parse(result.content);
                if (!parsedContent || !parsedContent.kind) {
                    throw new Error('Invalid content found in file');
                }
            } catch (e) {
                showToasty({
                    type: ToastType.ALERT,
                    title: 'Failed to read file',
                    message: (e as Error).message,
                });
                setLoading(false);
                return null;
            }
            let kind: string | null = null;
            try {
                kind = normalizeKapetaUri(parsedContent.kind);
            } catch (e) {
                showToasty({
                    type: ToastType.ALERT,
                    title: 'Failed to parse kind of file',
                    message: (e as Error).message,
                });
                setLoading(false);
                return null;
            }
            if (!kind || !opts.allowedKinds.map(normalizeKapetaUri).includes(kind)) {
                showToasty({
                    type: ToastType.ALERT,
                    title: 'Unexpected asset type',
                    message: `The selected asset have one of the following kinds: ${opts.allowedKinds.join(', ')}`,
                });
                setLoading(false);
                return null;
            }
        }

        try {
            const out = await opts.assetService.import(`file://${result.path}`);
            showToasty({
                type: ToastType.SUCCESS,
                title: 'Asset imported!',
                message: `${out.length} assets imported`,
            });
            return out;
        } catch (err) {
            showToasty({
                type: ToastType.ALERT,
                title: 'Failed to import asset',
                message: (err as Error).message,
            });
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        importAsset: importAssert,
    };
};
