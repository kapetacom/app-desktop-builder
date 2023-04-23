import React, { ComponentType, useMemo } from 'react';

import {
    FormField,
    FormFieldType,
    useFormContextField,
} from '@kapeta/ui-web-components';

import { BlockTypeProvider } from '@kapeta/ui-web-context';

import './BlockForm.less';
import { BlockTypeEditorProps } from '@kapeta/ui-web-types';
import { ErrorBoundary } from 'react-error-boundary';
import { ProjectHomeFolderInputProps } from '../fields/ProjectHomeFolderInput';
import { AutoLoadAssetNameInput } from '../fields/AutoLoadAssetNameInput';
import {BlockDefinition} from "@kapeta/schemas";

interface Props extends ProjectHomeFolderInputProps {
    creating?: boolean;
    asset: any
}

interface InnerBlockTypeProps {
    block: BlockDefinition
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
        <ErrorBoundary
            resetKeys={[props.kind]}
            fallback={<div>Failed to render block type: {props.kind}</div>}
        >
            <BlockTypeComponent block={props.block} creating={props.creating} />
        </ErrorBoundary>
    );
};

export const BlockForm = (props: Props) => {
    const kindField = useFormContextField<string>('kind');

    const blockTypeOptions = useMemo(() => {
        const options: { [key: string]: string } = {};
        try {
            BlockTypeProvider.listAll().forEach((blockTypeConfig) => {
                const id = `${blockTypeConfig.kind}:${blockTypeConfig.version}`;
                const name = blockTypeConfig.title
                    ? blockTypeConfig.title
                    : blockTypeConfig.kind;
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
            />

            <AutoLoadAssetNameInput
                name="metadata.name"
                label="Name"
                help={
                    'Give your block a system name prefixed with your handle - e.g. "myhandle/my-block"'
                }
            />

            <FormField
                name="metadata.title"
                type={FormFieldType.STRING}
                label="Title"
                help="Give your block a human-friendly title"
            />

            <InnerBlockType
                block={props.asset}
                kind={kindField.get()}
                creating={props.creating ?? false}
            />
        </div>
    );
};
