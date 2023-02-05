import Path from "path";
import React from "react";
import {action} from "mobx";

import {Asset, EntityConfigProps, FileInfo, SchemaKind} from "@blockware/ui-web-types";

import {AssetStore, FileSystemService} from "@blockware/ui-web-context";

import {FileBrowserDialog} from "../file-browser/FileBrowserDialog";

import "./AssetImport.less";
import {
    Button,
    ButtonStyle,
    ButtonType,
    FormButtons,
    FormContainer,
    PanelAlignment,
    PanelSize,
    SidePanel
} from "@blockware/ui-web-components";


interface AssetImportProps {
    assetService: AssetStore
    onDone: (asset?:Asset) => void
    skipFiles: string[]//A collection of files to prevent importing as they are already loaded
    title: string
    introduction: string
    fileName: string
    createNewKind: () => SchemaKind
    formRenderer: React.ComponentType<EntityConfigProps>
    fileSelectableHandler: (file: FileInfo) => boolean
}


interface AssetImportState {
    importing: boolean
    newEntity: SchemaKind
}

export class AssetImport extends React.Component<AssetImportProps, AssetImportState> {
    private createPanel: SidePanel | null = null;

    private filePanel: FileBrowserDialog | null = null;

    constructor(props: any) {
        super(props);

        this.state = {
            newEntity: this.createNewEntity(),
            importing: false
        };
    }

    private openImportPanel = () => {
        this.setState({
            importing: true
        }, () => {
            this.openFilePanel();
        });
    };

    private openCreatePanel = () => {
        this.resetNewEntity();

        this.setState({
            importing: false
        }, () => {
            this.createPanel && this.createPanel.open();
        });
    };


    private closeCreatePanel = () => {
        this.createPanel && this.createPanel.close();
        this.resetNewEntity();
    };

    private closeImportPanel = () => {
        this.setState({
            importing: false
        }, () => {
            this.closeFilePanel();
        });

        this.resetNewEntity();
    };

    private saveNewEntity = () => {
        this.openFilePanel();
    };

    private openFilePanel = () => {
        this.filePanel && this.filePanel.open();
    };

    private closeFilePanel = () => {
        this.filePanel && this.filePanel.close();
    };

    private onFileSelection = async (file: FileInfo) => {
        try {
            let assets:Asset[];
            if (this.state.importing) {
                // @ts-ignore
                assets = await this.props.assetService.import('file://' + file.path);
                this.closeImportPanel();
            } else {
                // @ts-ignore
                assets = await this.props.assetService.create(Path.join(file.path, this.props.fileName), this.state.newEntity);
                this.closeCreatePanel();
            }

            this.markAsDone(assets.length > 0 ? assets[0] : undefined);
        } catch (err:any) {
            console.error('Failed on file selection', err.stack);
        }
    };

    private markAsDone(asset?:Asset) {
        if (!this.props.onDone) {
            return;
        }

        this.props.onDone(asset);
    }

    private createNewEntity() {
        return this.props.createNewKind()
    }

    @action
    private resetNewEntity() {
        this.setState({
            newEntity: this.createNewEntity()
        });
    }

    @action
    private onNewEntityUpdate = (metadata: any, spec: any) => {
        this.setState({
            newEntity: {
                kind: this.props.createNewKind().kind,
                metadata,
                spec
            }
        });
    };

    private selectableHandler = (file: FileInfo) => {
        if (this.state.importing) {
            //Filter the selectable files / folders in the import
            return this.props.fileSelectableHandler(file);
        }
        //When creating we want only folders
        return !!file.folder;
    };

    render() {


        return (<div className={'entity-import'}>
                <div className={'actions'}>
                    <Button text="Create" onClick={this.openCreatePanel} width={90} />
                    <Button text="Import" onClick={this.openImportPanel} width={90}  />
                </div>


                <SidePanel
                    ref={(ref:SidePanel) => this.createPanel = ref}
                    size={PanelSize.medium}
                    side={PanelAlignment.right}
                    onClose={this.closeCreatePanel}
                    title={this.props.title} >

                    <div className={'entity-form'}>
                        <FormContainer onSubmit={this.saveNewEntity}>
                            <this.props.formRenderer
                                {...this.state.newEntity}
                                creating={true}
                                onDataChanged={(metadata, spec) => this.onNewEntityUpdate(metadata, spec)}
                            />

                            <FormButtons>
                                <Button type={ButtonType.BUTTON}
                                        style={ButtonStyle.DANGER}
                                        onClick={this.closeCreatePanel}
                                        width={100}
                                        text={'Cancel'} />
                                <Button type={ButtonType.SUBMIT}
                                        style={ButtonStyle.PRIMARY}
                                        width={100}
                                        text={'Create'} />
                            </FormButtons>
                        </FormContainer>
                    </div>
                </SidePanel>

                <FileBrowserDialog
                    ref={(ref) => { this.filePanel = ref }}
                    skipFiles={this.props.skipFiles}
                    service={FileSystemService}
                    onSelect={this.onFileSelection}
                    onClose={this.closeFilePanel}
                    selectable={this.selectableHandler} />

            </div>
        );
    }


}
