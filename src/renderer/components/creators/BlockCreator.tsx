import React from 'react';

import { FileInfo, SchemaKind } from '@kapeta/ui-web-types';
import { BlockTypeProvider, AssetStore } from '@kapeta/ui-web-context';

import { BlockDefinition } from '@kapeta/schemas';
import { AssetInfo } from '@kapeta/ui-web-plan-editor';
import { AssetCreator, AssetCreatorState } from './AssetCreator';
import { BlockForm } from '../forms/BlockForm';

interface Props {
    state: AssetCreatorState;
    onAssetCreateStart?: (data: BlockDefinition) => void;
    onAssetCreateEnd?: (errorMessage?: string) => void;
    /**
     * Unused
     * @deprecated
     */
    // eslint-disable-next-line react/no-unused-prop-types
    onStateChanged: (state: AssetCreatorState) => void;
    assetService: AssetStore;
    files: string[];
    onCancel?: () => void;
    onError?: (e: any) => void;
    onDone?: (asset?: AssetInfo<SchemaKind>) => void;
    onAssetAdded?: (asset: AssetInfo<SchemaKind>) => void;
    createNewKind?: () => BlockDefinition;
}

export const createNewBlock = (): BlockDefinition => {
    return {
        kind: BlockTypeProvider.getDefaultKind(),
        metadata: {
            name: '',
            version: '0.0.1',
        },
        spec: {
            consumers: [],
            providers: [],
            entities: [],
        },
    };
};

const noop = () => {
    // Do nothing
};

const selectableHandler = (file: FileInfo) => {
    return file.path.endsWith('/kapeta.yml');
};

export const BlockCreator = (props: Props) => {
    return (
        <AssetCreator
            state={props.state}
            onCancel={props.onCancel}
            onError={props.onError}
            onAssetAdded={props.onAssetAdded ?? noop}
            onAssetCreateStart={props.onAssetCreateStart}
            onAssetCreateEnd={props.onAssetCreateEnd}
            skipFiles={props.files}
            title="Create new block..."
            createNewKind={props.createNewKind ?? createNewBlock}
            fileName="kapeta.yml"
            onDone={props.onDone ?? noop}
            fileSelectableHandler={selectableHandler}
            assetService={props.assetService}
            formRenderer={BlockForm}
        />
    );
};
