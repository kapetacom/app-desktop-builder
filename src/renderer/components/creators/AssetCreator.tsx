import Path from 'path';
import React, { useCallback, useEffect, useState } from 'react';

import { FileInfo, SchemaKind } from '@kapeta/ui-web-types';

import { AssetStore } from '@kapeta/ui-web-context';
import {
    FormButtons,
    FormContainer,
    showToasty,
    ToastType,
} from '@kapeta/ui-web-components';

import './AssetCreator.less';
import { ProjectHomeFolderInput } from '../fields/ProjectHomeFolderInput';
import { replaceBase64IconWithUrl } from '../../utils/iconHelpers';
import {
    AssetInfo,
    fromAsset,
    PlannerSidebar,
} from '@kapeta/ui-web-plan-editor';
import { kapetaLight } from '../../Theme';
import { Button, ThemeProvider } from '@mui/material';
import { showFilePickerOne } from '../../utils/showFilePicker';

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
    onAssetCreateStart?: (data: SchemaKind) => void;
    onAssetCreateEnd?: (errorMessage?: string) => void;
    onDone?: (asset?: AssetInfo<SchemaKind>) => void;
    skipFiles: string[]; // A collection of files to prevent importing as they are already loaded
    title: string;
    fileName: string;
    createNewKind: () => SchemaKind;
    formRenderer: React.ComponentType<CreatingFormProps>;
    fileSelectableHandler: (file: FileInfo) => boolean;
    onAssetAdded?: (asset: AssetInfo<SchemaKind>) => void;
    state: AssetCreatorState;
    onCancel?: () => void;
    onError?: (e: any) => void;
}

export const AssetCreator = (props: Props) => {
    const [newEntity, setNewEntity] = useState<SchemaKind>();
    const [useProjectHome, setUseProjectHome] = useState<boolean>();
    const [projectHome, setProjectHome] = useState<string>();

    const onSubmit = async (data: SchemaKind) => {
        if (useProjectHome && projectHome) {
            const path = Path.join(projectHome, data.metadata.name);
            await createAsset(path, data);
            return;
        }

        setNewEntity(data);

        const filePath = await showFilePickerOne({
            title: 'Choose a folder',
            selectDirectory: true,
        });
        if (filePath) {
            await createAsset(filePath, data);
        }
    };

    const createAsset = async (filePath: string, content: SchemaKind) => {
        try {
            if (content.spec.icon) {
                await replaceBase64IconWithUrl(content);
            }

            if (props.onAssetCreateStart) {
                props.onAssetCreateStart(content);
            }

            const assets: AssetInfo<SchemaKind>[] = (
                await props.assetService.create(
                    Path.join(filePath, '/kapeta.yml'),
                    content
                )
            ).map(fromAsset);

            setNewEntity(props.createNewKind());

            if (props.onAssetAdded && assets.length > 0) {
                props.onAssetAdded(assets[0]);
            }

            if (props.onDone) {
                props.onDone(assets[0]);
            }

            if (props.onAssetCreateEnd) {
                props.onAssetCreateEnd();
            }
        } catch (e: any) {
            if (props.onError) {
                props.onError(e);
            }

            if (props.onAssetCreateEnd) {
                props.onAssetCreateEnd(e.message);
            }

            showToasty({
                type: ToastType.ALERT,
                title: 'Failed to create asset',
                message: e.message,
            });
        }
    };

    // Initialization handler, depending on import or create
    useEffect(() => {
        if (props.state === AssetCreatorState.CREATING) {
            // When changed to creating - set new entity
            setNewEntity(props.createNewKind());
        }
        if (props.state === AssetCreatorState.IMPORTING) {
            (async () => {
                const path = await showFilePickerOne({
                    title: 'Choose kapeta asset to import',
                    filters: [
                        {
                            name: 'Kapeta Asset',
                            extensions: ['yml'],
                        },
                    ],
                });
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
                } else {
                    props.onCancel && props.onCancel();
                }
            })();
        }
    }, [props.state, props.assetService]);

    const InnerFormRenderer = props.formRenderer;
    return (
        <ThemeProvider theme={kapetaLight}>
            <PlannerSidebar
                open={props.state === AssetCreatorState.CREATING}
                onClose={() => {
                    if (props.onCancel) {
                        props.onCancel();
                    }
                }}
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
                                color={'error'}
                                variant={'contained'}
                                onClick={() => {
                                    if (props.onCancel) {
                                        props.onCancel();
                                    }
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                color={'primary'}
                                type={'submit'}
                                variant={'contained'}
                            >
                                Create
                            </Button>
                        </FormButtons>
                    </FormContainer>
                </div>
            </PlannerSidebar>
        </ThemeProvider>
    );
};
