import Path from 'path';
import React from 'react';

import {
    Asset,
    FileInfo,
    SchemaKind,
} from '@blockware/ui-web-types';

import {AssetService, AssetStore, FileSystemService} from '@blockware/ui-web-context';
import {
    Button,
    ButtonStyle,
    ButtonType,
    FormButtons,
    FormContainer,
    PanelAlignment,
    PanelSize, showToasty,
    SidePanel, ToastType,
} from '@blockware/ui-web-components';

import {FileBrowserDialog} from '../file-browser/FileBrowserDialog';

import './AssetCreator.less';
import {ProjectHomeFolderInput} from "../fields/ProjectHomeFolderInput";

export interface CreatingFormProps {
    creating?: boolean;
}

export enum AssetCreatorState {
    CLOSED,
    IMPORTING,
    CREATING
}

interface Props {
    assetService: AssetStore;
    onDone?: (asset?: Asset) => void;
    skipFiles: string[]; // A collection of files to prevent importing as they are already loaded
    title: string;
    introduction: string;
    fileName: string;
    createNewKind: () => SchemaKind;
    formRenderer: React.ComponentType<CreatingFormProps>;
    fileSelectableHandler: (file: FileInfo) => boolean;
    onAssetAdded?:(asset:Asset) => void
    state: AssetCreatorState
    onStateChanged: (state:AssetCreatorState) => void

}

interface State {
    newEntity: SchemaKind;
    useProjectHome?: boolean;
    projectHome?: string;
    filePanelOpen: boolean;
}

export class AssetCreator extends React.Component<Props, State> {

    constructor(props: any) {
        super(props);

        this.state = {
            newEntity: this.createNewEntity(),
            filePanelOpen: false,
        };
    }


    private closeCreatePanel = () => {
        this.setState({
            newEntity: this.createNewEntity(),
            filePanelOpen: false
        });
        this.props.onStateChanged(AssetCreatorState.CLOSED);
    };

    private closeImportPanel = () => {
        this.setState(
            {
                newEntity: this.createNewEntity(),
                filePanelOpen: false
            }
        );
        this.props.onStateChanged(AssetCreatorState.CLOSED);
    };

    private saveNewEntity = async (data: SchemaKind) => {
        if (this.state.useProjectHome && this.state.projectHome) {
            const path = Path.join(this.state.projectHome, data.metadata.name);
            await this.createAsset(path, data);
            return;
        }

        this.setState({
            newEntity: data,
            filePanelOpen: true
        });
    };

    private async createAsset(filePath: string, content: SchemaKind) {
        try {
            const assets: Asset[] = await AssetService.create(
                Path.join(filePath, '/blockware.yml'),
                content
            );

            this.setState({
                filePanelOpen: false,
                newEntity: this.createNewEntity(),
            });

            if (this.props.onAssetAdded && assets.length > 0) {
                this.props.onAssetAdded(assets[0]);
            }
            this.callDone(assets.length > 0 ? assets[0] : undefined);
        } catch (e) {
            showToasty({
                type: ToastType.ALERT,
                title: 'Failed to create asset',
                message: e.message,
            });
        }
    }

    private onFileSelection = async (file: FileInfo) => {
        try {
            let assets: Asset[];
            if (this.props.state === AssetCreatorState.IMPORTING) {
                assets = await this.props.assetService.import(
                    `file://${file.path}`
                );
                this.closeImportPanel();
            } else if (this.props.state === AssetCreatorState.CREATING) {
                assets = await this.props.assetService.create(
                    Path.join(file.path, this.props.fileName),
                    this.state.newEntity
                );
                this.closeCreatePanel();
            } else {
                return;
            }

            this.callDone(assets.length > 0 ? assets[0] : undefined);
        } catch (err: any) {
            console.error('Failed on file selection', err.stack);
        }
    };

    private callDone(asset?: Asset) {
        if (!this.props.onDone) {
            return;
        }

        this.props.onDone(asset);
    }

    private createNewEntity() {
        return this.props.createNewKind();
    }


    private selectableHandler = (file: FileInfo) => {
        if (this.props.state === AssetCreatorState.IMPORTING) {
            // Filter the selectable files / folders in the import
            return this.props.fileSelectableHandler(file);
        }
        // When creating we want only folders
        return !!file.folder;
    };

    private isFilePanelOpen() {
        if (this.props.state === AssetCreatorState.CLOSED) {
            return false;
        }
        return this.state.filePanelOpen || this.props.state === AssetCreatorState.IMPORTING;
    }

    private isCreatePanelOpen() {
        if (this.props.state === AssetCreatorState.CLOSED) {
            return false;
        }
        return this.props.state === AssetCreatorState.CREATING;
    }

    private onClosedFilePanel() {
        this.setState({filePanelOpen: false});
        if (this.props.state === AssetCreatorState.IMPORTING) {
            //Closing file panel closes all for import
            this.closeImportPanel();
        }
    }

    render() {
        return (
            <>
                <SidePanel
                    open={this.isCreatePanelOpen()}
                    size={PanelSize.medium}
                    side={PanelAlignment.right}
                    onClose={this.closeCreatePanel}
                    title={this.props.title}
                >
                    <div className="asset-creator-form">
                        <FormContainer
                            initialValue={this.state.newEntity}
                            onSubmitData={(data: any) => this.saveNewEntity(data)}>

                            <this.props.formRenderer creating/>

                            <ProjectHomeFolderInput
                                onChange={(useProjectHome, projectHome) => {
                                    this.setState({
                                        useProjectHome,
                                        projectHome
                                    });
                                }}
                            />

                            <FormButtons>
                                <Button
                                    type={ButtonType.BUTTON}
                                    style={ButtonStyle.DANGER}
                                    onClick={this.closeCreatePanel}
                                    width={100}
                                    text="Cancel"
                                />
                                <Button
                                    type={ButtonType.SUBMIT}
                                    style={ButtonStyle.PRIMARY}
                                    width={100}
                                    text="Create"
                                />
                            </FormButtons>
                        </FormContainer>
                    </div>
                </SidePanel>

                <FileBrowserDialog
                    open={this.isFilePanelOpen()}
                    skipFiles={this.props.skipFiles}
                    service={FileSystemService}
                    onSelect={this.onFileSelection}
                    onClose={() => this.onClosedFilePanel()}
                    selectable={this.selectableHandler}
                />
            </>
        );
    }
}
