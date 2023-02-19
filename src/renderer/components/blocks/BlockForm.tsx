import React, {ComponentType} from "react";
import {action} from "mobx";

import {
    Button,
    ButtonStyle,
    ButtonType,
    FormButtons,
    FormContainer,
    FormField,
    FormFieldType,
    FormRow
} from "@blockware/ui-web-components";

import {BlockTypeProvider} from "@blockware/ui-web-context";
import type {BlockKind, BlockMetadata, EntityConfigProps, SchemaKind, Type} from "@blockware/ui-web-types";

import './BlockForm.less';
import {BlockConfigComponentProps} from "@blockware/ui-web-types";
import {ErrorBoundary} from "react-error-boundary";

interface Props {
    block?: BlockKind
    creating?: boolean
    useProjectHome?: boolean
    projectHome?: string
    onProjectHomeClick?: () => void
    onUseProjectHomeChange?: (useProjectHome: boolean) => void
    onSubmit?: (data: BlockKind) => void
    onCancel?: () => void
}

interface State {
    block: BlockKind
}

function emptyBlock(): BlockKind<any> {
    return {
        kind: BlockTypeProvider.getDefaultKind(),
        metadata: {name: '', title: ''},
        spec: {}
    }
}

function validateBlockName(field: string, value: string) {
    if (!/^[a-z][a-z0-9_-]*\/[a-z][a-z0-9_-]*$/i.test(value)) {
        throw new Error('Invalid block name. Expected format is <handle>/<name>');
    }
}


class BlockForm extends React.Component<Props,State> {


    constructor(props: any) {
        super(props);

        this.state = {
            block: this.props.block ?? emptyBlock()
        }
    }

    cancel() {
        this.props.onCancel && this.props.onCancel();
        this.reset();
    }

    reset() {
        this.setState({block: emptyBlock()})
    }

    private async handleFormSubmit(data) {
        this.props.onSubmit &&
        await this.props.onSubmit(data);
    }

    createDropdownOptions() {
        let options: { [key: string]: string } = {};
        try {
            BlockTypeProvider.listAll().forEach(
                (blockTypeConfig) => {
                    const id = `${blockTypeConfig.kind}:${blockTypeConfig.version}`;
                    const name = blockTypeConfig.title ? blockTypeConfig.title : blockTypeConfig.kind;
                    options[id] = `${name} [${id}]`;
                }
            );
        } catch (e) {
            console.error('Failed to create drop down', e);
        }

        return options;
    }

    renderBlockType() {
        let BlockTypeComponent: ComponentType<BlockConfigComponentProps> | null = null;

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
            <ErrorBoundary fallback={<div>Failed to render block type: {this.state.block.kind}</div>}>
                <BlockTypeComponent creating={this.props.creating} />
            </ErrorBoundary>
        );
    }


    render() {

        return (
            <div className={"block-form"}>

                    <FormContainer
                        initialValue={this.state.block}
                        onChange={(data) => {
                            this.setState({block: data as SchemaKind});
                        }}
                        onSubmitData={async (data) => {
                            await this.handleFormSubmit(data);
                        }}>

                        <FormField
                            name={"kind"}
                            label={"Type"}
                            validation={['required']}
                            type={FormFieldType.ENUM}
                            help={"The type of block you want to create."}
                            options={this.createDropdownOptions()}
                            disabled={!this.props.creating}
                        />

                        <FormField name={'metadata.name'}
                                   validation={['required', validateBlockName]}
                                   type={FormFieldType.STRING}
                                   label={'Name'}
                                   help={'Give your block a system name prefixed with your handle - e.g. "myhandle/my-block"'}

                        />

                        <FormField name={'metadata.title'}
                                   type={FormFieldType.STRING}
                                   label={'Title'}
                                   help={'Give your block a human-friendly title'}

                        />


                        {this.props.creating &&
                            <div>
                                <FormRow label={'Project folder'}
                                         help={this.props.useProjectHome ?
                                             'Choose project home to create this block in' :
                                             'Check this to save block in project home'}
                                         focused={true}
                                         validation={this.props.useProjectHome ? ['required'] : []}
                                         type={'folder'}>
                                    <div
                                        data-name={'project_home'}
                                        data-value={this.props.projectHome}
                                        className={'project-home-folder'}>
                                        <input type={'checkbox'}
                                               data-name={'use_project_home'}
                                               data-value={this.props.useProjectHome}
                                               checked={this.props.useProjectHome}
                                               onChange={(evt) => {
                                                   this.props.onUseProjectHomeChange &&
                                                   this.props.onUseProjectHomeChange(evt.target.checked);
                                               }}/>
                                        <input type={'text'}
                                               readOnly={true}
                                               disabled={!this.props.useProjectHome}
                                               value={this.props.projectHome}
                                               onClick={() => {
                                                   if (!this.props.useProjectHome ||
                                                       !this.props.onProjectHomeClick) {
                                                       return;
                                                   }

                                                   this.props.onProjectHomeClick();
                                               }}/>
                                    </div>
                                </FormRow>
                            </div>
                        }

                        {this.renderBlockType()}

                        <FormButtons>
                            <Button width={70} type={ButtonType.BUTTON} style={ButtonStyle.DANGER}
                                    onClick={() => this.cancel()} text="Cancel"/>
                            <Button width={70} type={ButtonType.SUBMIT} style={ButtonStyle.PRIMARY}
                                    text={this.props.creating ? 'Create' : 'Update'}/>

                        </FormButtons>

                    </FormContainer>
            </div>
        );
    }
}

export default BlockForm;
