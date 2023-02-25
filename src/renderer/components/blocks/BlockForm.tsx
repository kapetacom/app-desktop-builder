import React, { ComponentType } from 'react';

import {
    AssetNameInput,
    Button,
    ButtonStyle,
    ButtonType,
    FormButtons,
    FormContainer,
    FormField,
    FormFieldType,
    FormRow,
    SimpleLoader,
} from '@blockware/ui-web-components';

import { BlockTypeProvider, IdentityService } from '@blockware/ui-web-context';
import type {
    BlockKind,
    BlockServiceSpec,
    SchemaKind,
} from '@blockware/ui-web-types';

import './BlockForm.less';
import { BlockConfigComponentProps } from '@blockware/ui-web-types';
import { ErrorBoundary } from 'react-error-boundary';
import { useAsync } from 'react-use';
import {ProjectHomeFolderInput, ProjectHomeFolderInputProps} from "../utils/ProjectHomeFolderInput";

interface Props extends ProjectHomeFolderInputProps {
    block?: BlockKind;
    creating?: boolean;
    onSubmit?: (data: BlockKind) => void;
    onCancel?: () => void;
}

interface State {
    block: BlockKind;
}

function emptyBlock(): BlockKind<BlockServiceSpec> {
    return {
        kind: BlockTypeProvider.getDefaultKind(),
        metadata: { name: '', title: '' },
        spec: {
            target: {
                kind: 'empty',
            },
        },
    };
}

// Higher-order-component to allow us to use hooks for data loading (not possible in class components)
const withNamespaces = (Component) => {
    return (props) => {
        const { value: namespaces, loading } = useAsync(async () => {
            const identity = await IdentityService.getCurrent();
            const memberships = await IdentityService.getMemberships(
                identity.id
            );
            return [
                identity.handle,
                ...memberships.map((membership) => membership.identity.handle),
            ];
        });
        return (
            <SimpleLoader loading={loading}>
                <Component {...props} namespaces={namespaces || []} />
            </SimpleLoader>
        );
    };
};
const AutoLoadAssetNameInput = withNamespaces(AssetNameInput);

class BlockForm extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            block: this.props.block ?? emptyBlock(),
        };
    }

    cancel() {
        this.props.onCancel && this.props.onCancel();
        this.reset();
    }

    reset() {
        this.setState({ block: emptyBlock() });
    }

    private async handleFormSubmit(data) {
        this.props.onSubmit && (await this.props.onSubmit(data));
    }

    createDropdownOptions() {
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
    }

    renderBlockType() {
        let BlockTypeComponent: ComponentType<BlockConfigComponentProps> | null =
            null;

        if (!this.state.block.kind) {
            return <div>Select block type</div>;
        }

        const currentTarget = BlockTypeProvider.get(this.state.block.kind);

        if (currentTarget && currentTarget.componentType) {
            BlockTypeComponent = currentTarget.componentType;
        }

        if (!BlockTypeComponent) {
            return <div>No configuration for block type</div>;
        }

        return (
            <ErrorBoundary
                fallback={
                    <div>
                        Failed to render block type: {this.state.block.kind}
                    </div>
                }
            >
                <BlockTypeComponent creating={this.props.creating} />
            </ErrorBoundary>
        );
    }

    render() {
        return (
            <div className="block-form">
                <FormContainer
                    initialValue={this.state.block}
                    onChange={(data) => {
                        this.setState({ block: data as SchemaKind });
                    }}
                    onSubmitData={async (data) => {
                        await this.handleFormSubmit(data);
                    }}
                >
                    <FormField
                        name="kind"
                        label="Type"
                        validation={['required']}
                        type={FormFieldType.ENUM}
                        help="The type of block you want to create."
                        options={this.createDropdownOptions()}
                        disabled={!this.props.creating}
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

                    {this.props.creating && (
                        <div>
                            <ProjectHomeFolderInput {...this.props} />
                        </div>
                    )}

                    {this.renderBlockType()}

                    <FormButtons>
                        <Button
                            width={70}
                            type={ButtonType.BUTTON}
                            style={ButtonStyle.DANGER}
                            onClick={() => this.cancel()}
                            text="Cancel"
                        />
                        <Button
                            width={70}
                            type={ButtonType.SUBMIT}
                            style={ButtonStyle.PRIMARY}
                            text={this.props.creating ? 'Create' : 'Update'}
                        />
                    </FormButtons>
                </FormContainer>
            </div>
        );
    }
}

export default BlockForm;
