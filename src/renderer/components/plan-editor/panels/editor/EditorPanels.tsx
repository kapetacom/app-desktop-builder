import React, { useCallback, useContext, useMemo } from 'react';
import {
    AssetNameInput,
    FormButtons,
    FormContainer,
    FormField,
    FormFieldType,
    SimpleLoader,
    useFormContextField,
} from '@kapeta/ui-web-components';

import { BlockTypeProvider, IdentityService, ResourceTypeProvider } from '@kapeta/ui-web-context';

import { parseKapetaUri } from '@kapeta/nodejs-utils';

import type { IResourceTypeProvider, SchemaKind } from '@kapeta/ui-web-types';
import { ResourceRole } from '@kapeta/ui-web-types';
import { BlockDefinition, Resource, Connection, Entity, IconType } from '@kapeta/schemas';

import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useAsync } from 'react-use';
import { cloneDeep } from 'lodash';
import { PlannerContext, PlannerContextData, PlannerSidebar } from '@kapeta/ui-web-plan-editor';
import { BlockInfo, DataEntityType, EditItemInfo } from '../../types';

import './ItemEditorPanel.less';
import { uploadAttachment } from '../../../../api/AttachmentService';
import { replaceBase64IconWithUrl } from '../../../../utils/iconHelpers';
import { Button } from '@mui/material';
import { useKapetaContext } from '../../../../hooks/contextHook';
import { useNamespacesForField } from '../../../../hooks/useNamespacesForField';

function getVersions(dataKindUri) {
    const versions: { [key: string]: string } = {};
    const versionAlternatives = ResourceTypeProvider.getVersionsFor(dataKindUri.fullName);
    versionAlternatives.forEach((version) => {
        const versionName = version === 'local' ? 'Local Disk' : version;
        const altResourceType = ResourceTypeProvider.get(`${dataKindUri.fullName}:${version}`);
        versions[`${dataKindUri.fullName}:${version}`] =
            altResourceType && altResourceType.title ? `${altResourceType.title} [${versionName}]` : versionName;
    });

    return versions;
}

interface BlockFieldsProps {
    data: SchemaKind;
}

const BlockFields = ({ data }: BlockFieldsProps) => {
    const context = useKapetaContext();
    const kindUri = parseKapetaUri(data.kind);

    const options = useMemo(() => {
        const versions = BlockTypeProvider.getVersionsFor(kindUri.fullName);
        const out: { [key: string]: string } = {};

        versions.forEach((version) => {
            const id = `${kindUri.fullName}:${version}`;
            const typeProvider = BlockTypeProvider.get(id);
            const title = typeProvider.title ?? typeProvider.kind;
            out[id] = `${title} [${version}]`;
        });
        return out;
    }, [kindUri.fullName]);

    const namespaces = useNamespacesForField('metadata.name');

    return (
        <>
            <FormField
                name="kind"
                type={FormFieldType.ENUM}
                label="Type"
                validation={['required']}
                help="The block type and version"
                options={options}
            />

            <AssetNameInput
                name="metadata.name"
                label="Name"
                namespaces={namespaces}
                defaultValue={context.activeContext?.identity?.handle ?? 'local'}
                help={'The name of this block - e.g. "myhandle/my-block"'}
            />

            <FormField name="metadata.title" label="Title" help="This blocks human-friendly title" />
        </>
    );
};

interface InnerFormProps {
    planner: PlannerContextData;
    info: EditItemInfo;
}

const InnerForm = ({ planner, info }: InnerFormProps) => {
    const mappingField = useFormContextField('mapping');
    const kindField = useFormContextField('kind');
    const getErrorFallback = useCallback(
        // eslint-disable-next-line react/no-unstable-nested-components
        (kind) => (props: FallbackProps) => {
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

        const fromBlock = planner.getBlockById(connection.provider.blockId);
        const toBlock = planner.getBlockById(connection.consumer.blockId);

        return (
            <MappingComponent
                title="mapping-editor"
                source={source}
                target={target}
                sourceEntities={fromBlock?.spec.entities?.types ?? ([] as Entity[])}
                targetEntities={toBlock?.spec.entities?.types ?? ([] as Entity[])}
                value={mappingField.get(connection.mapping)}
                onDataChanged={(change) => {
                    mappingField.set(change.data);
                }}
            />
        );
    }

    if (info.type === DataEntityType.INSTANCE) {
        const data = info.item as BlockInfo;
        const kind = kindField.get(data.block.kind);
        const BlockTypeConfig = BlockTypeProvider.get(kind);

        if (!BlockTypeConfig.editorComponent) {
            return (
                <div key={data.instance.block.ref}>
                    <BlockFields data={data.block} />
                </div>
            );
        }
        const EditorComponent = BlockTypeConfig.editorComponent;

        return (
            <div key={kind}>
                <BlockFields data={data.block} />
                <ErrorBoundary fallbackRender={getErrorFallback(kind)}>
                    <EditorComponent block={data.block} creating={info.creating} />
                </ErrorBoundary>
            </div>
        );
    }

    if (info.type === DataEntityType.RESOURCE) {
        const data = info.item.resource as Resource;
        const kind = kindField.get(data.kind) || data.kind;
        let resourceType: IResourceTypeProvider | null = null;
        try {
            resourceType = ResourceTypeProvider.get(kind);
        } catch (e) {
            console.warn('Failed to get resource type for kind: ', kind);
        }

        const dataKindUri = parseKapetaUri(kind);
        const versions = getVersions(dataKindUri);

        return (
            <>
                <FormField
                    options={versions}
                    type={FormFieldType.ENUM}
                    help="The kind and version of this resource"
                    validation={['required']}
                    label="Resource kind"
                    name="kind"
                />
                {resourceType?.editorComponent && (
                    <ErrorBoundary resetKeys={[kind, info.item]} fallbackRender={getErrorFallback(kind)}>
                        <resourceType.editorComponent key={kind} block={info.item.block} creating={info.creating} />
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
    // callbacks
    const saveAndClose = async (data: any) => {
        switch (props.info?.type) {
            case DataEntityType.CONNECTION:
                planner.updateConnectionMapping(data as Connection);
                break;
            case DataEntityType.INSTANCE:
            case DataEntityType.BLOCK: {
                const blockData = data as BlockDefinition;

                await replaceBase64IconWithUrl(blockData);

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

    const onPanelCancel = () => {
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

    const initialValue = useMemo(() => {
        switch (props.info?.type) {
            case DataEntityType.CONNECTION:
                return cloneDeep(props.info.item);
            case DataEntityType.INSTANCE:
                return cloneDeep(props.info.item.block);
            case DataEntityType.BLOCK:
                return cloneDeep(props.info.item.asset.content);
            case DataEntityType.RESOURCE:
                return cloneDeep(props.info.item.resource);
        }

        return {};
    }, [props.info]);

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
            (name, value) => {
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
                    >
                        <div className="item-form">
                            <InnerForm planner={planner} info={props.info} />
                        </div>
                        <FormButtons>
                            <Button variant={'contained'} color={'error'} onClick={props.onClosed}>
                                Cancel
                            </Button>
                            <Button variant={'contained'} color={'primary'} type="submit">
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
