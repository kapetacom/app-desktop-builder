import React, {Component} from "react";
import {action, makeObservable, observable, toJS} from "mobx";
import {observer} from "mobx-react";

import {
    Button,
    ButtonType,
    FormButtons,
    FormContainer,
    ButtonStyle,
    FormSelect,
    FormInput
} from "@blockware/ui-web-components";

import {BlockTypeProvider} from "@blockware/ui-web-context";
import type {BlockKind, BlockMetadata, EntityConfigProps, Type} from "@blockware/ui-web-types";

import './BlockForm.less';

interface BlockFormProps {
    block?: BlockKind
    creating?: boolean
    onSubmit?: (data: BlockKind) => void
    onCancel?: () => void
}

function emptyBlock(): BlockKind<any> {
    return {
        kind: BlockTypeProvider.getDefaultKind(),
        metadata: {name: '', title: ''},
        spec: {}
    }
}

function validateBlockName(field:string, value:string) {
  if (!/^[a-z][a-z0-9_-]*\/[a-z][a-z0-9_-]*$/i.test(value)) {
    throw new Error('Invalid block name. Expected format is <handle>/<name>');
  }
}

@observer
class BlockForm extends React.Component<BlockFormProps> {

    @observable
    private block: BlockKind<any> = emptyBlock();

    @observable
    private kind: string = this.block.kind.toLowerCase();

    constructor(props: any) {
        super(props);

        if (this.props.block) {
            this.block = this.props.block;
        }

        if (!this.block.kind) {
            this.block.kind = BlockTypeProvider.getDefaultKind();
        }

        this.kind = this.block.kind.toLowerCase();
        makeObservable(this);
    }

    cancel() {
        this.props.onCancel && this.props.onCancel();
        this.reset();
    }

    @action
    reset() {
        this.block = emptyBlock();
    }

    handleFormSubmit() {
        this.props.onSubmit && this.props.onSubmit(toJS(this.block));
        this.reset();
    }

    @action
    createDropdownOptions() {
        let options: { [key: string]: string } = {};
        BlockTypeProvider.listAll().forEach(
          (blockTypeConfig) => {
            const id = `${blockTypeConfig.kind}:${blockTypeConfig.version}`;
            const name = blockTypeConfig.title ? blockTypeConfig.title : blockTypeConfig.kind;
            options[id] = `${name} [${id}]`;
          }
        );
        return options;
    }

    @action
    handleBlockKindChanged = (name: string, value: string) => {
        this.kind = value;
        this.block.kind = this.kind;
        this.block.metadata = {
            name: this.block.metadata.name,
            title: this.block.metadata.title
        };
        this.block.spec = {};
    }


    @action
    handleMetaDataChanged = (name: string, value: string) => {
        switch (name) {
            case 'name':
            case 'title':
                this.block.metadata[name] = value

        }
    }

    renderBlockType() {
        let BlockTypeComponent: Type<Component<EntityConfigProps, any>> | null = null;

        if (!this.block.kind) {
            return <div>Select block type</div>;
        }

        const currentTarget = BlockTypeProvider.get(this.block.kind);

        if (currentTarget && currentTarget.componentType) {
            BlockTypeComponent = currentTarget.componentType;
        }

        if (!BlockTypeComponent) {
            return <div>No configuration for block type</div>;
        }

        return (
            <BlockTypeComponent
                kind={this.block.kind}
                creating={this.props.creating}
                metadata={toJS(this.block.metadata)}
                spec={toJS(this.block.spec)}
                onDataChanged={(metadata: BlockMetadata, spec: any) => {
                    this.block.spec = spec
                }}/>
        );
    }

    render() {

        return (
            <div className={"block-form"}>
                <FormContainer onSubmit={() => {
                    this.handleFormSubmit()
                }}>

                    <FormSelect
                        name={"kind"}
                        value={this.kind}
                        label={"Type"}
                        validation={['required']}
                        help={"The type of block you want to create."}
                        options={this.createDropdownOptions()}
                        onChange={this.handleBlockKindChanged}
                        disabled={!this.props.creating}
                    />

                    <FormInput name={'name'}
                               validation={['required', validateBlockName]}
                               value={this.block.metadata.name}
                               onChange={this.handleMetaDataChanged}
                               label={'Name'}
                               help={'Give your block a system name prefixed with your handle - e.g. "myhandle/my-block"'}

                    />

                    <FormInput name={'title'}
                               label={'Title'}
                               value={this.block.metadata.title}
                               onChange={this.handleMetaDataChanged}
                               help={'Give your block a human-friendly title'}

                    />

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
