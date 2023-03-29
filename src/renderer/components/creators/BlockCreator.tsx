import React from 'react';

import { Asset, FileInfo } from '@kapeta/ui-web-types';
import { BlockTypeProvider, AssetStore } from '@kapeta/ui-web-context';

import { AssetCreator, AssetCreatorState } from './AssetCreator';
import { BlockForm } from '../forms/BlockForm';

interface Props {
    state: AssetCreatorState;
    onStateChanged: (state: AssetCreatorState) => void;
    assetService: AssetStore;
    files: string[];
    onDone?: (asset?: Asset) => void;
    onAssetAdded?: (asset: Asset) => void;
}

const createNewBlock = () => {
    return {
        kind: BlockTypeProvider.getDefaultKind(),
        metadata: {
            name: '',
            version: '0.0.1',
        },
        spec: {
            target: {
                kind: '',
            },
        },
    };
};

const selectableHandler = (file: FileInfo) => {
    return file.path.endsWith('/kapeta.yml');
};

export const BlockCreator = (props: Props) => {
    return (
        <AssetCreator
            state={props.state}
            onStateChanged={props.onStateChanged}
            onAssetAdded={props.onAssetAdded}
            skipFiles={props.files}
            title="Create new block..."
            createNewKind={createNewBlock}
            fileName="kapeta.yml"
            onDone={props.onDone}
            fileSelectableHandler={selectableHandler}
            assetService={props.assetService}
            formRenderer={BlockForm}
        />
    );
};
