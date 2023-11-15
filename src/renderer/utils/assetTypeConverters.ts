/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { IBlockTypeProvider, IResourceTypeProvider } from '@kapeta/ui-web-types';
import { AssetVersionSelectorEntry } from '@kapeta/ui-web-components';
import { normalizeKapetaUri } from '@kapeta/nodejs-utils';

export const fromTypeProviderToAssetType = (
    typeProvider: IResourceTypeProvider | IBlockTypeProvider
): AssetVersionSelectorEntry => {
    const ref = normalizeKapetaUri(`${typeProvider.kind}:${typeProvider.version}`);
    const title = typeProvider.title ? typeProvider.title : typeProvider.kind;

    const anySpec = typeProvider.definition?.spec as any;

    return {
        ref,
        title,
        kind: typeProvider.definition.kind,
        icon: typeProvider.icon || anySpec?.icon,
    };
};
