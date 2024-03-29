/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
    AssetVersionSelector,
    FormButtons,
    FormContainer,
    showToasty,
    ToastType,
    useConfirm,
    useFormContextField,
} from '@kapeta/ui-web-components';

import { BlockTargetProvider, BlockTypeProvider, ResourceTypeProvider } from '@kapeta/ui-web-context';

import { parseKapetaUri, KapetaURI } from '@kapeta/nodejs-utils';

import type { IResourceTypeProvider, ResourceConnectionMappingChange, ResourceWithSpec } from '@kapeta/ui-web-types';
import { ResourceRole } from '@kapeta/ui-web-types';
import { BlockDefinition, Resource, Connection, BlockInstance } from '@kapeta/schemas';

import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import _, { cloneDeep } from 'lodash';
import {
    PlannerContext,
    PlannerContextData,
    PlannerSidebar,
    useBlockEntities,
    useDirectDSL,
    useTransformEntities,
} from '@kapeta/ui-web-plan-editor';
import { BlockInfo, DataEntityType, EditItemInfo } from '../../types';

import './ItemEditorPanel.less';
import { replaceBase64IconWithUrl } from '../../../../utils/iconHelpers';
import { Button } from '@mui/material';
import { fromTypeProviderToAssetType } from '../../../../utils/assetTypeConverters';
import { updateBlockFromMapping } from '../../helpers';
import { InstanceEditor } from './inner/InstanceEditor';
import { useEffect } from 'react';

function getResourceVersions(dataKindUri: KapetaURI) {
    const allVersions = ResourceTypeProvider.getVersionsFor(dataKindUri.fullName);
    return allVersions.map((version) => {
        return fromTypeProviderToAssetType(ResourceTypeProvider.get(`${dataKindUri.fullName}:${version}`));
    });
}

interface InnerFormProps {
    planner: PlannerContextData;
    info: EditItemInfo;
    onContextDataChanged: (data: any) => void;
}

interface ConnectionContextData {
    change: ResourceConnectionMappingChange;
    fromBlock: BlockDefinition;
    fromBlockInstance: BlockInstance;
    fromResource: ResourceWithSpec<any>;
    toBlock: BlockDefinition;
    toBlockInstance: BlockInstance;
    toResource: ResourceWithSpec<any>;
}

const InnerForm = ({ planner, info, onContextDataChanged }: InnerFormProps) => {
    const mappingField = useFormContextField('mapping');
    const kindField = useFormContextField('kind');
    const getErrorFallback = useCallback(
        // eslint-disable-next-line react/no-unstable-nested-components
        (kind: string) => (props: FallbackProps) => {
            return (
                <div>
                    Failed to render block type: {kind}. <br />
                    Error: {props.error.message}
                </div>
            );
        },
        []
    );

    if (info.type === DataEntityType.CONNECTION) {
        const connection = info.item as Connection;

        const source = planner.getResourceByBlockIdAndName(
            connection.provider.blockId,
            connection.provider.resourceName,
            ResourceRole.PROVIDES
        );

        const target = planner.getResourceByBlockIdAndName(
            connection.consumer.blockId,
            connection.consumer.resourceName,
            ResourceRole.CONSUMES
        );

        if (!source || !target) {
            throw new Error(`Could not find resource for connection: ${JSON.stringify(connection)}`);
        }

        const ConverterType = ResourceTypeProvider.getConverterFor(source.kind, target.kind);
        if (!ConverterType) {
            return null;
        }

        const MappingComponent = ConverterType.mappingComponentType;
        if (!MappingComponent) {
            return null;
        }
        const fromBlockInstance = planner.plan?.spec.blocks.find(
            (instance) => instance.id === connection.provider.blockId
        );
        const fromBlock = planner.getBlockById(connection.provider.blockId);

        const toBlockInstance = planner.plan?.spec.blocks.find(
            (instance) => instance.id === connection.consumer.blockId
        );
        const toBlock = planner.getBlockById(connection.consumer.blockId);

        const currentValue = mappingField.get(connection.mapping);

        const sourceTypes = useBlockEntities(source.kind, fromBlock);
        const sourceEntities = useTransformEntities(source.kind, sourceTypes);
        const targetTypes = useBlockEntities(target.kind, toBlock);
        const targetEntities = useTransformEntities(source.kind, targetTypes);
        const sourceClone = useMemo(() => cloneDeep(source), [source]);
        const targetClone = useMemo(() => cloneDeep(target), [target]);

        return (
            <MappingComponent
                title="mapping-editor"
                source={sourceClone}
                target={targetClone}
                sourceEntities={sourceEntities}
                targetEntities={targetEntities}
                value={currentValue}
                onDataChanged={(change) => {
                    mappingField.set(change.data);

                    const contextData: ConnectionContextData = {
                        change,
                        fromBlock: fromBlock!,
                        fromBlockInstance: fromBlockInstance!,
                        toBlock: toBlock!,
                        toBlockInstance: toBlockInstance!,
                        fromResource: source,
                        toResource: target,
                    };
                    onContextDataChanged(contextData);
                }}
            />
        );
    }

    if (info.type === DataEntityType.INSTANCE) {
        const data = info.item as BlockInfo;
        const kind = kindField.get(data.block.kind);
        const BlockTypeConfig = BlockTypeProvider.get(kind);

        return <InstanceEditor creating={info.creating} data={data} kind={kind} blockTypeConfig={BlockTypeConfig} />;
    }

    if (info.type === DataEntityType.RESOURCE) {
        const data = info.item.resource as Resource;
        const block = info.item.block as BlockDefinition;
        const kind = kindField.get(data.kind) || data.kind;
        let resourceType: IResourceTypeProvider | null = null;
        try {
            resourceType = ResourceTypeProvider.get(kind);
        } catch (e) {
            console.warn('Failed to get resource type for kind: ', kind);
        }

        const dataKindUri = parseKapetaUri(kind);
        const assetTypes = getResourceVersions(dataKindUri);

        const blockProvider = useMemo(() => {
            return BlockTypeProvider.get(block.kind);
        }, [block.kind]);

        const languageProvider = useMemo(() => {
            return block.spec.target?.kind ? BlockTargetProvider.get(block.spec.target.kind, block.kind) : undefined;
        }, [block.spec.target?.kind, block.kind]);

        return (
            <>
                <AssetVersionSelector
                    name="kind"
                    label="Resource kind"
                    validation={['required']}
                    help="The kind and version of this resource"
                    assetTypes={assetTypes}
                />

                {resourceType?.editorComponent && (
                    <ErrorBoundary resetKeys={[kind, info.item]} fallbackRender={getErrorFallback(kind)}>
                        <resourceType.editorComponent
                            key={kind}
                            block={info.item.block}
                            creating={info.creating}
                            context={{
                                blockProvider,
                                languageProvider,
                            }}
                        />
                    </ErrorBoundary>
                )}
            </>
        );
    }

    return null;
};

interface Props {
    info?: EditItemInfo | null;
    open: boolean;
    onClosed: () => void;
}

export const EditorPanels: React.FC<Props> = (props) => {
    const planner = useContext(PlannerContext);
    const confirm = useConfirm();
    const [contextData, setContextData] = useState<any>();
    const [currentData, setCurrentData] = useState<any>();
    // callbacks
    const saveAndClose = async (data: any) => {
        switch (props.info?.type) {
            case DataEntityType.CONNECTION:
                const connection = data as Connection;
                try {
                    if (contextData) {
                        // Mapping might cause changes to the resource or block definitions
                        const connectionContextData = contextData as ConnectionContextData;
                        const newFromBlock = updateBlockFromMapping(
                            ResourceRole.PROVIDES,
                            connectionContextData.change.source,
                            connectionContextData.change.sourceEntities,
                            connectionContextData.fromResource,
                            connectionContextData.fromBlock
                        );

                        if (newFromBlock) {
                            //If we had to add entities to the source block, we need to update the block definition
                            planner.updateBlockDefinition(
                                connectionContextData.fromBlockInstance.block.ref,
                                newFromBlock
                            );
                        }

                        const newToBlock = updateBlockFromMapping(
                            ResourceRole.CONSUMES,
                            connectionContextData.change.target,
                            connectionContextData.change.targetEntities,
                            connectionContextData.toResource,
                            connectionContextData.toBlock
                        );

                        if (newToBlock) {
                            //If we had to add entities to the source block, we need to update the block definition
                            planner.updateBlockDefinition(connectionContextData.toBlockInstance.block.ref, newToBlock);
                        }
                    }
                    // Update the connection
                    planner.updateConnectionMapping(connection);
                } catch (e) {
                    console.error('Failed to update context from connection: ', e, contextData);
                }
                break;
            case DataEntityType.INSTANCE:
            case DataEntityType.BLOCK: {
                const blockData = data as BlockDefinition;

                try {
                    await replaceBase64IconWithUrl(blockData);
                } catch (e: any) {
                    if (e.stack) {
                        console.error('Upload failed', e.stack);
                    }
                    showToasty({
                        type: ToastType.ALERT,
                        message: e.error ?? e.message,
                        title: 'Upload failed',
                    });
                    return;
                }

                planner.updateBlockDefinition(props.info.item.instance.block.ref, blockData);
                break;
            }
            case DataEntityType.RESOURCE: {
                const resource = props.info.item.resource as Resource;
                const role = props.info.item.block?.spec?.consumers?.includes(resource)
                    ? ResourceRole.CONSUMES
                    : ResourceRole.PROVIDES;
                planner.updateResource(props.info.item.ref, resource.metadata.name, role, data as Resource);
                break;
            }
        }
        props.onClosed();
    };

    const initialValue = useMemo(() => {
        let block: BlockDefinition;
        switch (props.info?.type) {
            case DataEntityType.CONNECTION:
                return cloneDeep(props.info.item);
            case DataEntityType.INSTANCE:
                block = cloneDeep(props.info.item.block);
                if (!block.metadata.visibility) {
                    block.metadata.visibility = 'private';
                }
                return block;
            case DataEntityType.BLOCK:
                block = cloneDeep(props.info.item.asset.content);
                if (!block.metadata.visibility) {
                    block.metadata.visibility = 'private';
                }
                return block;
            case DataEntityType.RESOURCE:
                return cloneDeep(props.info.item.resource);
        }

        return {} as any;
    }, [props.info]);

    useEffect(() => {
        setCurrentData(initialValue);
    }, [initialValue]);

    const onPanelCancel = async () => {
        const hasEditorChanges =
            // Entity editor
            !_.isEqual(currentData?.spec?.entities?.source, initialValue?.spec?.entities?.source) ||
            // REST editor
            !_.isEqual(currentData?.spec?.source, initialValue?.spec?.source) ||
            // Parameters editor
            !_.isEqual(currentData?.spec?.configuration, initialValue?.spec?.configuration);

        if (
            hasEditorChanges &&
            !(await confirm({
                title: 'Unsaved changes',
                content: 'Are you sure you want to close this panel without saving?',
                confirmationText: 'Close without saving',
                confirmationButtonProps: { color: 'error' },
                cancellationText: 'Keep editing',
            }))
        ) {
            return;
        }

        if (props.info?.creating) {
            // We remove the item if it was created in this session and then cancelled
            switch (props.info?.type) {
                case DataEntityType.CONNECTION:
                    planner.removeConnection(props.info.item);
                    break;
                case DataEntityType.BLOCK:
                    planner.removeBlockDefinition(props.info.item.asset);
                    planner.removeBlockInstance(props.info.item.instance.id);
                    break;
                case DataEntityType.INSTANCE:
                    planner.removeBlockInstance(props.info.item.instance.id);
                    break;
                case DataEntityType.RESOURCE: {
                    const resource = props.info.item.resource;
                    const resourceType = ResourceTypeProvider.get(resource.kind);
                    planner.removeResource(props.info.item.ref, resource.metadata.name, resourceType.role);
                    break;
                }
            }
        }
        props.onClosed();
    };

    const existingNames = useMemo(() => {
        if (props.info && props.info.type === DataEntityType.RESOURCE) {
            const propResource = props.info.item.resource;
            const resources =
                ResourceTypeProvider.get(propResource.kind).role === ResourceRole.PROVIDES
                    ? props.info.item.block.spec.providers
                    : props.info.item.block.spec.consumers;
            // Remove one instance of current name, not all in order to allow correcting existing duplicate entries
            const index = resources?.findIndex((resource) => resource.metadata.name === propResource.metadata.name);
            return resources?.filter((_x, i) => i !== index).map((resource) => resource.metadata.name) || [];
        }
        return [];
    }, [props.info]);

    const globalValidators = useMemo(
        () => [
            (name: string, value: string) => {
                if (name === 'metadata.name' && existingNames.includes(value)) {
                    throw new Error('Resource name already exists');
                }
            },
        ],
        [existingNames]
    );

    const panelHeader = () => {
        if (!props.info) {
            return '';
        }
        return `Edit ${props.info.type.toLowerCase()}`;
    };

    return (
        <PlannerSidebar title={panelHeader()} open={props.open} onClose={onPanelCancel}>
            {props.info && (
                <div className="item-editor-panel">
                    <FormContainer
                        validators={globalValidators}
                        initialValue={initialValue}
                        onSubmitData={(data) => saveAndClose(data)}
                        onChange={(data) => {
                            setCurrentData(data);
                        }}
                    >
                        <div className="item-form">
                            <InnerForm planner={planner} info={props.info} onContextDataChanged={setContextData} />
                        </div>
                        <FormButtons>
                            <Button variant={'contained'} color={'error'} onClick={props.onClosed}>
                                Cancel
                            </Button>
                            <Button variant={'contained'} disabled={false} color={'primary'} type="submit">
                                Save
                            </Button>
                        </FormButtons>
                    </FormContainer>
                </div>
            )}
            {!props.info && <div>No item selected</div>}
        </PlannerSidebar>
    );
};
