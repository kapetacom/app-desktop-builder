import React, { ComponentType, useMemo } from 'react';

import { AssetNameInput, FormField, FormFieldType, useFormContextField } from '@kapeta/ui-web-components';

import { BlockTypeProvider } from '@kapeta/ui-web-context';

import './BlockForm.less';
import { BlockTypeEditorProps } from '@kapeta/ui-web-types';
import { ErrorBoundary } from 'react-error-boundary';
import { BlockDefinition } from '@kapeta/schemas';
import { ProjectHomeFolderInputProps } from '../fields/ProjectHomeFolderInput';
import { useKapetaContext } from '../../hooks/contextHook';
import { useNamespacesForField } from '../../hooks/useNamespacesForField';

interface Props extends ProjectHomeFolderInputProps {
    creating?: boolean;
    asset: any;
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

    const blockTypeOptions = useMemo(() => {
        const options: { [key: string]: string } = {};
        try {
            BlockTypeProvider.listAll().forEach((blockTypeConfig) => {
                const id = `${blockTypeConfig.kind}:${blockTypeConfig.version}`;
                const name = blockTypeConfig.title ? blockTypeConfig.title : blockTypeConfig.kind;
                options[id] = `${name} [${id}]`;
            });
        } catch (e) {
            console.error('Failed to create drop down', e);
        }

        return options;
    }, []);

    return (
        <div className="block-form">
            <FormField
                name="kind"
                label="Type"
                validation={['required']}
                type={FormFieldType.ENUM}
                help="The type of block you want to create."
                options={blockTypeOptions}
                disabled={!props.creating}
                readOnly={props.readOnly}
            />

            <AssetNameInput
                name="metadata.name"
                label="Name"
                namespaces={namespaces}
                defaultValue={context.activeContext?.identity?.handle ?? 'local'}
                help={'The name of this block - e.g. "myhandle/my-block"'}
                readOnly={props.readOnly}
            />

            <FormField
                name="metadata.title"
                type={FormFieldType.STRING}
                label="Title"
                help="Give your block a human-friendly title"
                readOnly={props.readOnly}
            />

            <InnerBlockType block={props.asset} kind={kindField.get()} creating={props.creating ?? false} />
        </div>
    );
};
