/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { AssetService } from '../../api/AssetService';
import { AssetInfo, MissingReference, ReferenceResolutionHandler } from '@kapeta/ui-web-plan-editor';
import React, { useMemo } from 'react';
import { BlockDefinition, Plan } from '@kapeta/schemas';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { api } from '../../api/APIService';
import { showFilePickerOne } from '../../utils/showFilePicker';

interface Props {
    open?: boolean;
    onClose?: () => void;
    plan: Plan;
    planRef: string;
    blockAssets: AssetInfo<BlockDefinition>[];
    missingReferences: MissingReference[];
    inline?: boolean;
}

export const DesktopReferenceResolutionHandler = (props: Props) => {
    const planUri = useMemo(() => parseKapetaUri(props.planRef), [props.planRef]);

    return (
        <ReferenceResolutionHandler
            open={Boolean(props.open || props.inline)}
            onClose={props.onClose}
            plan={props.plan}
            inline={props.inline}
            delayedCheck={props.inline ? 5000 : 0}
            readOnly={planUri.version !== 'local'}
            blockAssets={props.blockAssets}
            assetCanBeInstalled={async (ref: string) => {
                const uri = parseKapetaUri(ref);
                const asset = await api.registry().getAsset(uri.fullName, uri.version);
                return Boolean(asset);
            }}
            installAsset={async (ref: string) => {
                await AssetService.install(ref, true);
            }}
            importAsset={async (filePath: string) => {
                const assetSchemas = await AssetService.import(filePath);
                if (!assetSchemas.length) {
                    throw new Error('No asset found in file');
                }
                return assetSchemas[0].ref;
            }}
            selectAssetFromDisk={async () => {
                const result = await showFilePickerOne({
                    title: 'Choose asset to import',
                    filters: [
                        {
                            name: 'Kapeta Asset',
                            extensions: ['yml'],
                        },
                    ],
                });

                return result?.path;
            }}
            missingReferences={props.missingReferences}
            onResolved={async (result) => {
                try {
                    if (result.plan) {
                        await AssetService.update(props.planRef, result.plan);
                    }
                    if (result.blockAssets.length > 0) {
                        for (const blockAsset of result.blockAssets) {
                            await AssetService.update(blockAsset.ref, blockAsset.content);
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            }}
        />
    );
};
