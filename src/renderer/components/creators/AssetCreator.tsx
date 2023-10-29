/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import Path from 'path';
import React, { useEffect, useState } from 'react';
import { FileInfo, SchemaKind } from '@kapeta/ui-web-types';
import { AssetStore } from '@kapeta/ui-web-context';
import {
    FormButtons,
    FormContainer,
    showToasty,
    ToastType,
    createVerticalScrollShadow,
} from '@kapeta/ui-web-components';
import { ProjectHomeFolderInput } from '../fields/ProjectHomeFolderInput';
import { replaceBase64IconWithUrl } from '../../utils/iconHelpers';
import { AssetInfo, fromAsset, PlannerSidebar } from '@kapeta/ui-web-plan-editor';
import { Box, Button, Stack } from '@mui/material';
import { showFilePickerOne } from '../../utils/showFilePicker';

export interface CreatingFormProps {
    creating?: boolean;
    asset?: any;
}

export enum AssetCreatorState {
    CLOSED,
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

        const result = await showFilePickerOne({
            title: 'Choose a folder',
            selectDirectory: true,
        });
        if (result?.path) {
            await createAsset(result.path, data);
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
                await props.assetService.create(Path.join(filePath, '/kapeta.yml'), content)
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
    }, [props.state, props.assetService]);

    const InnerFormRenderer = props.formRenderer;
    return (
        <PlannerSidebar
            open={props.state === AssetCreatorState.CREATING}
            onClose={() => {
                if (props.onCancel) {
                    props.onCancel();
                }
            }}
            title={props.title}
        >
            <Box
                sx={{
                    height: '100%',
                    overflow: 'hidden',
                    '& > .form-container': {
                        height: '100%',
                        overflow: 'hidden',
                    },
                }}
            >
                <FormContainer initialValue={newEntity} onSubmitData={(data: any) => onSubmit(data)}>
                    <Stack
                        direction={'column'}
                        className="asset-creator-form"
                        sx={{
                            height: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        <Stack
                            direction={'column'}
                            sx={{
                                height: '100%',
                                ...createVerticalScrollShadow(0.1),
                            }}
                        >
                            <InnerFormRenderer asset={newEntity} creating />

                            <ProjectHomeFolderInput
                                onChange={(newUseProjectHome, newProjectHome) => {
                                    setUseProjectHome(newUseProjectHome);
                                    setProjectHome(newProjectHome);
                                }}
                            />
                        </Stack>

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
                            <Button color={'primary'} type={'submit'} variant={'contained'}>
                                Create
                            </Button>
                        </FormButtons>
                    </Stack>
                </FormContainer>
            </Box>
        </PlannerSidebar>
    );
};
