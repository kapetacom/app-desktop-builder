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

class BlockStoreImport extends React.Component<BlockStoreImportProps> {
    private defaultKind: string;

    constructor(props: BlockStoreImportProps) {
        super(props);

        this.defaultKind = BlockTypeProvider.getDefaultKind();
    }

    createNewBlock = () => {
        return {
            kind: this.defaultKind,
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

    selectableHandler = (file: FileInfo) => {
        return file.path.endsWith('/blockware.yml');
    };

    render() {
        const blockTypeConfig = BlockTypeProvider.get(this.defaultKind);

        return (
            <AssetImport
                skipFiles={this.props.files}
                title="Create new block..."
                introduction="Choose whether to import an existing block or create a new one."
                createNewKind={this.createNewBlock}
                fileName="blockware.yml"
                onDone={this.props.onDone}
                fileSelectableHandler={this.selectableHandler}
                assetService={this.props.assetService}
                // TODO: What the hell?
                // @ts-ignore
                formRenderer={blockTypeConfig.componentType}
            />
        );
    }
}
export default BlockStoreImport;
