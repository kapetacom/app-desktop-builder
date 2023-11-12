/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { ComponentType, useMemo } from 'react';

import {
    AssetVersionSelector,
    AssetVersionSelectorEntry,
    AssetNameInput,
    FormField,
    FormFieldType,
    useFormContextField,
} from '@kapeta/ui-web-components';

import { BlockTypeProvider } from '@kapeta/ui-web-context';

import './BlockForm.less';
import { BlockTypeEditorProps } from '@kapeta/ui-web-types';
import { ErrorBoundary } from 'react-error-boundary';
import { BlockDefinition } from '@kapeta/schemas';
import { ProjectHomeFolderInputProps } from '../fields/ProjectHomeFolderInput';
import { useKapetaContext } from '../../hooks/contextHook';
import { useNamespacesForField } from '../../hooks/useNamespacesForField';
import { fromTypeProviderToAssetType } from '../../utils/assetTypeConverters';

interface Props extends ProjectHomeFolderInputProps {
    creating?: boolean;
    asset?: any;
    readOnly?: boolean;
}

interface InnerBlockTypeProps {
    block: BlockDefinition;
    kind?: string;
    creating?: boolean;
}

const InnerBlockType = (props: InnerBlockTypeProps) => {
    let BlockTypeComponent: ComponentType<BlockTypeEditorProps> | null = null;

    if (!props.kind) {
        return <div>Select block type</div>;
    }

    const currentTarget = BlockTypeProvider.get(props.kind);

    if (currentTarget && currentTarget.editorComponent) {
        BlockTypeComponent = currentTarget.editorComponent;
    }

    if (!BlockTypeComponent) {
        return <div>No configuration for block type</div>;
    }

    return (
        <ErrorBoundary resetKeys={[props.kind]} fallback={<div>Failed to render block type: {props.kind}</div>}>
            <BlockTypeComponent block={props.block} creating={props.creating} />
        </ErrorBoundary>
    );
};

export const BlockForm = (props: Props) => {
    const context = useKapetaContext();
    const namespaces = useNamespacesForField('metadata.name');
    const kindField = useFormContextField<string>('kind');

    const assetTypes: AssetVersionSelectorEntry[] = useMemo(() => {
        try {
            return BlockTypeProvider.listAll().map(fromTypeProviderToAssetType);
        } catch (e) {
            console.error('Failed to create drop down', e);
            return [];
        }
    }, []);

    return (
        <div className="block-form">
            <AssetVersionSelector
                name="kind"
                label="Type"
                validation={['required']}
                help="The type of block you want to create."
                disabled={!props.creating}
                readOnly={props.readOnly}
                assetTypes={assetTypes}
            />

            <AssetNameInput
                name="metadata.name"
                label="Name"
                validation={['required']}
                namespaces={namespaces}
                autoFocus={true}
                onFocus={(evt) => {
                    evt.target.select();
                }}
                defaultValue={context.activeContext?.identity?.handle ?? 'local'}
                help={'The name of this block - e.g. "myhandle/my-block"'}
                readOnly={props.readOnly}
            />

            <FormField
                name="metadata.visibility"
                type={FormFieldType.ENUM}
                validation={['required']}
                options={{
                    public: 'Public',
                    private: 'Private',
                }}
                label="Visiblity"
                help="Determine if your Block is available on Block Hub, The Kapeta Market Place"
            />

            <FormField
                name="metadata.title"
                type={FormFieldType.STRING}
                label="Title"
                help="Give your block a human-friendly title"
                readOnly={props.readOnly}
            />

            <FormField
                name="metadata.description"
                type={FormFieldType.TEXT}
                label="Description"
                help="Give your block a longer description"
            />

            <InnerBlockType block={props.asset} kind={kindField.get()} creating={props.creating ?? false} />
        </div>
    );
};
