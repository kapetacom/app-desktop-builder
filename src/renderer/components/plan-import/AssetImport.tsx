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

import './AssetImport.less';
import {ProjectHomeFolderInput} from "../utils/ProjectHomeFolderInput";

export interface CreatingFormProps {
    creating?: boolean;
}

interface AssetImportProps {
    assetService: AssetStore;
    onDone: (asset?: Asset) => void;
    skipFiles: string[]; // A collection of files to prevent importing as they are already loaded
    title: string;
    introduction: string;
    fileName: string;
    createNewKind: () => SchemaKind;
    formRenderer: React.ComponentType<CreatingFormProps>;
    fileSelectableHandler: (file: FileInfo) => boolean;
    onAssetAdded?:(asset:Asset) => void
}

interface AssetImportState {
    importing: boolean;
    newEntity: SchemaKind;
    useProjectHome?: boolean;
    projectHome?: string;
    filePanelOpen: boolean;
    createPanelOpen: boolean;
}

export class AssetImport extends React.Component<AssetImportProps, AssetImportState> {

    constructor(props: any) {
        super(props);

        this.state = {
            newEntity: this.createNewEntity(),
            importing: false,
            filePanelOpen: false,
            createPanelOpen: false
        };
    }

    private openImportPanel = () => {
        this.setState(
            {
                importing: true,
                createPanelOpen: false,
                filePanelOpen: true
            }
        );
    };

    private openCreatePanel = () => {

        this.setState(
            {
                importing: false,
                createPanelOpen: true,
                filePanelOpen: false,
                newEntity: this.createNewEntity(),
            }
        );
    };

    private closeCreatePanel = () => {
        this.setState({
            createPanelOpen: false,
            newEntity: this.createNewEntity(),
        });
    };

    private closeImportPanel = () => {
        this.setState(
            {
                importing: false,
                filePanelOpen: false,
                newEntity: this.createNewEntity(),
            }
        );
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
        })
    };

    private async createAsset(filePath: string, content: SchemaKind) {
        try {
            const assets: Asset[] = await AssetService.create(
                Path.join(filePath, '/blockware.yml'),
                content
            );

            this.setState({
                createPanelOpen: false,
                filePanelOpen: false,
                newEntity: this.createNewEntity(),
            });

            if (this.props.onAssetAdded && assets.length > 0) {
                this.props.onAssetAdded(assets[0]);
            }
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
            if (this.state.importing) {
                assets = await this.props.assetService.import(
                    `file://${file.path}`
                );
                this.closeImportPanel();
            } else {
                assets = await this.props.assetService.create(
                    Path.join(file.path, this.props.fileName),
                    this.state.newEntity
                );
                this.closeCreatePanel();
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
        if (this.state.importing) {
            // Filter the selectable files / folders in the import
            return this.props.fileSelectableHandler(file);
        }
        // When creating we want only folders
        return !!file.folder;
    };

    render() {
        return (
            <div className="entity-import">
                <div className="actions">
                    <Button
                        text="Create"
                        onClick={this.openCreatePanel}
                        width={90}
                    />
                    <Button
                        text="Import"
                        onClick={this.openImportPanel}
                        width={90}
                    />
                </div>

                <SidePanel
                    open={this.state.createPanelOpen}
                    size={PanelSize.medium}
                    side={PanelAlignment.right}
                    onClose={this.closeCreatePanel}
                    title={this.props.title}
                >
                    <div className="entity-form">
                        <FormContainer
                            initialValue={this.state.newEntity}
                            onSubmitData={(data: any) => this.saveNewEntity(data)}>
                            <this.props.formRenderer creating/>

                            <ProjectHomeFolderInput
                                useProjectHome={this.state.useProjectHome}
                                onChange={async (useProjectHome, projectHome) => {
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
                    open={this.state.filePanelOpen}
                    skipFiles={this.props.skipFiles}
                    service={FileSystemService}
                    onSelect={this.onFileSelection}
                    onClose={() => this.setState({filePanelOpen: false})}
                    selectable={this.selectableHandler}
                />
            </div>
        );
    }
}
