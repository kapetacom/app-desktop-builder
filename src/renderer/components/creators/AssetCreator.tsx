import Path from 'path';
import React, { useCallback, useEffect, useState } from 'react';

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
import { replaceBase64IconWithUrl } from '../../utils/iconHelpers';

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

export const AssetCreator = (props: Props) => {
    const [newEntity, setNewEntity] = useState<SchemaKind>();
    const [useProjectHome, setUseProjectHome] = useState<boolean>();
    const [projectHome, setProjectHome] = useState<string>();

    const [processing, setProcessing] = useState<{
        promise?: Promise<string>;
        resolve?: (string) => void;
        reject?: (any) => void;
    }>({});

    const closeCreatePanel = () => {
        props.onStateChanged(AssetCreatorState.CLOSED);
    };

    const closeFilePicker = useCallback(() => {
        processing.resolve?.call(null);
    }, [processing]);

    // promise based file picker callbacks
    const waitForFilePicker = useCallback(() => {
        const newP: typeof processing = {};
        newP.promise = new Promise((resolve, reject) => {
            newP.resolve = resolve;
            newP.reject = reject;
        });
        // unset itself when settled
        setProcessing(newP);
        // eslint-disable-next-line promise/catch-or-return
        newP.promise!.finally(() => {
            setProcessing({});
        });
        return newP.promise;
    }, [setProcessing]);

    const onSubmit = async (data: SchemaKind) => {
        if (useProjectHome && projectHome) {
            const path = Path.join(projectHome, data.metadata.name);
            await createAsset(path, data);
            return;
        }

        setNewEntity(data);

        const filePath = await waitForFilePicker();
        if (filePath) {
            await createAsset(filePath, data);
        }
    };

    const createAsset = async (filePath: string, content: SchemaKind) => {
        try {
            if (content.spec.icon) {
                await replaceBase64IconWithUrl(content);
            }
            const assets: Asset[] = await AssetService.create(
                Path.join(filePath, '/kapeta.yml'),
                content
            );

            setNewEntity(props.createNewKind());

            if (props.onAssetAdded && assets.length > 0) {
                props.onAssetAdded(assets[0]);
            }
            props.onDone?.call(null, assets?.[0]);
        } catch (e) {
            showToasty({
                type: ToastType.ALERT,
                title: 'Failed to create asset',
                message: e.message,
            });
        }
    };

    const selectableHandler = useCallback(
        (file: FileInfo) => {
            if (props.state === AssetCreatorState.IMPORTING) {
                // Filter the selectable files / folders in the import
                return props.fileSelectableHandler.call(null, file);
            }
            // When creating we want only folders
            return !!file.folder;
        },
        [props.state, props.fileSelectableHandler]
    );

    // Initialization handler, depending on import or create
    useEffect(() => {
        if (props.state === AssetCreatorState.CREATING) {
            // When changed to creating - set new entity
            setNewEntity(props.createNewKind.call(null));
        }
        if (props.state === AssetCreatorState.IMPORTING) {
            (async () => {
                const path = await waitForFilePicker();
                if (path) {
                    try {
                        const assets = props.assetService.import(
                            `file://${path}`
                        );
                        props.onDone?.call(null, assets[0]);
                    } catch (err) {
                        showToasty({
                            type: ToastType.ALERT,
                            title: 'Failed to import asset',
                            message: err.message,
                        });
                    }
                }
            })();
        }
    }, [
        props.onDone,
        props.state,
        props.assetService,
        props.createNewKind,
        waitForFilePicker,
    ]);

    const InnerFormRenderer = props.formRenderer;
    return (
        <>
            <SidePanel
                open={props.state === AssetCreatorState.CREATING}
                size={PanelSize.medium}
                side={PanelAlignment.right}
                onClose={closeCreatePanel}
                title={props.title}
            >
                <div className="asset-creator-form">
                    <FormContainer
                        initialValue={newEntity}
                        onSubmitData={(data: any) => onSubmit(data)}
                    >
                        <InnerFormRenderer asset={newEntity} creating />

                        <ProjectHomeFolderInput
                            onChange={(newUseProjectHome, newProjectHome) => {
                                setUseProjectHome(newUseProjectHome);
                                setProjectHome(newProjectHome);
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
                open={!!processing.promise}
                skipFiles={props.skipFiles}
                service={FileSystemService}
                onSelect={(file: FileInfo) => {
                    processing.resolve?.call(null, file.path);
                }}
                onClose={() => closeFilePicker()}
                selectable={selectableHandler}
            />
        </>
    );
};
