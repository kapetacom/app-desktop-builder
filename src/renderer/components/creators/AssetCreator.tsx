import Path from 'path';
import React, {useEffect, useState} from 'react';

import { Asset, FileInfo, SchemaKind } from '@kapeta/ui-web-types';

import {
    AssetService,
    AssetStore,
    FileSystemService,
} from '@kapeta/ui-web-context';
import {
    Button,
    ButtonStyle,
    ButtonType,
    FormButtons,
    FormContainer,
    PanelAlignment,
    PanelSize,
    showToasty,
    SidePanel,
    ToastType,
} from '@kapeta/ui-web-components';

import { FileBrowserDialog } from '../file-browser/FileBrowserDialog';

import './AssetCreator.less';
import { ProjectHomeFolderInput } from '../fields/ProjectHomeFolderInput';

export interface CreatingFormProps {
    creating?: boolean;
    asset?: any;
}

export enum AssetCreatorState {
    CLOSED,
    IMPORTING,
    CREATING,
}

interface Props {
    assetService: AssetStore;
    onDone?: (asset?: Asset) => void;
    skipFiles: string[]; // A collection of files to prevent importing as they are already loaded
    title: string;
    fileName: string;
    createNewKind: () => SchemaKind;
    formRenderer: React.ComponentType<CreatingFormProps>;
    fileSelectableHandler: (file: FileInfo) => boolean;
    onAssetAdded?: (asset: Asset) => void;
    state: AssetCreatorState;
    onStateChanged: (state: AssetCreatorState) => void;
}


export const AssetCreator = (props:Props) => {

    const [newEntity, setNewEntity] = useState<SchemaKind>();
    const [useProjectHome, setUseProjectHome] = useState<boolean>();
    const [projectHome, setProjectHome] = useState<string>();
    const [filePanelOpen, setFilePanelOpen] = useState<boolean>();


    const closeCreatePanel = () => {
        setNewEntity(createNewEntity())
        setFilePanelOpen(false);
        props.onStateChanged(AssetCreatorState.CLOSED);
    };

    const closeImportPanel = () => {
        setNewEntity(createNewEntity())
        setFilePanelOpen(false);
        props.onStateChanged(AssetCreatorState.CLOSED);
    };

    const saveNewEntity = async (data: SchemaKind) => {
        if (useProjectHome && projectHome) {
            const path = Path.join(projectHome, data.metadata.name);
            await createAsset(path, data);
            return;
        }

        setNewEntity(data);
        setFilePanelOpen(true);
    };

    const createAsset = async (filePath: string, content: SchemaKind) => {
        try {
            const assets: Asset[] = await AssetService.create(
                Path.join(filePath, '/kapeta.yml'),
                content
            );

            setFilePanelOpen(false);
            setNewEntity(createNewEntity());

            if (props.onAssetAdded && assets.length > 0) {
                props.onAssetAdded(assets[0]);
            }
            callDone(assets.length > 0 ? assets[0] : undefined);
        } catch (e) {
            showToasty({
                type: ToastType.ALERT,
                title: 'Failed to create asset',
                message: e.message,
            });
        }
    }

    const onFileSelection = async (file: FileInfo) => {
        if (!newEntity) {
            return;
        }
        try {
            let assets: Asset[];
            if (props.state === AssetCreatorState.IMPORTING) {
                assets = await props.assetService.import(
                    `file://${file.path}`
                );
                closeImportPanel();
            } else if (props.state === AssetCreatorState.CREATING) {
                assets = await props.assetService.create(
                    Path.join(file.path, props.fileName),
                    newEntity
                );
                closeCreatePanel();
            } else {
                return;
            }

            callDone(assets.length > 0 ? assets[0] : undefined);
        } catch (err: any) {
            console.error('Failed on file selection', err.stack);
        }
    };

    const callDone = (asset?: Asset) => {
        if (!props.onDone) {
            return;
        }

        props.onDone(asset);
    }

    const createNewEntity = () => {
        return props.createNewKind();
    }

    const selectableHandler = (file: FileInfo) => {
        if (props.state === AssetCreatorState.IMPORTING) {
            // Filter the selectable files / folders in the import
            return props.fileSelectableHandler(file);
        }
        // When creating we want only folders
        return !!file.folder;
    };

    const isFilePanelOpen = () => {
        if (props.state === AssetCreatorState.CLOSED) {
            return false;
        }
        return (
            filePanelOpen ||
            props.state === AssetCreatorState.IMPORTING
        );
    }

    const isCreatePanelOpen = () => {
        if (props.state === AssetCreatorState.CLOSED) {
            return false;
        }
        return props.state === AssetCreatorState.CREATING;
    }

    const onClosedFilePanel = () => {
        setFilePanelOpen(false);
        if (props.state === AssetCreatorState.IMPORTING) {
            // Closing file panel closes all for import
            closeImportPanel();
        }
    }

    useEffect(() => {
        if (props.state === AssetCreatorState.CREATING) {
            //When changed to creating - set new entity
            setNewEntity(createNewEntity());
        }
    }, [props.state]);

    const InnerFormRenderer = props.formRenderer;
    return (
        <>
            <SidePanel
                open={isCreatePanelOpen()}
                size={PanelSize.medium}
                side={PanelAlignment.right}
                onClose={closeCreatePanel}
                title={props.title}
            >
                <div className="asset-creator-form">
                    <FormContainer
                        initialValue={newEntity}
                        onSubmitData={(data: any) =>
                            saveNewEntity(data)
                        }
                    >
                        <InnerFormRenderer asset={newEntity} creating />

                        <ProjectHomeFolderInput
                            onChange={(useProjectHome, projectHome) => {
                                setUseProjectHome(useProjectHome);
                                setProjectHome(projectHome);
                            }}
                        />

                        <FormButtons>
                            <Button
                                type={ButtonType.BUTTON}
                                style={ButtonStyle.DANGER}
                                onClick={closeCreatePanel}
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
                open={isFilePanelOpen()}
                skipFiles={props.skipFiles}
                service={FileSystemService}
                onSelect={onFileSelection}
                onClose={() => onClosedFilePanel()}
                selectable={selectableHandler}
            />
        </>
    );
}
