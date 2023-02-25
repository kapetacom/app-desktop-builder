import React from 'react';

import { FileInfo } from '@blockware/ui-web-types';
import { BlockTypeProvider, AssetStore } from '@blockware/ui-web-context';

import { AssetImport } from '../../plan-import/AssetImport';

interface BlockStoreImportProps {
    assetService: AssetStore;
    onDone: () => void;
    open: boolean;
    files: string[];
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
    return file.path.endsWith('/blockware.yml');
};

export const BlockStoreImport = (props:BlockStoreImportProps) => {
    const defaultKind = BlockTypeProvider.getDefaultKind();
    const blockTypeConfig = BlockTypeProvider.get(defaultKind);

    return (
        <AssetImport
            skipFiles={props.files}
            title="Create new block..."
            introduction="Choose whether to import an existing block or create a new one."
            createNewKind={createNewBlock}
            fileName="blockware.yml"
            onDone={props.onDone}
            fileSelectableHandler={selectableHandler}
            assetService={props.assetService}
            formRenderer={blockTypeConfig.componentType}
        />
    );
}
