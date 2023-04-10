import React, {useContext, useMemo} from 'react';
import {
    AssetNameInput,
    Button,
    ButtonStyle,
    ButtonType,
    FormButtons,
    FormContainer,
    FormField,
    FormFieldType,
    PanelSize,
    SidePanel,
    SimpleLoader,
    useFormContextField,
} from '@kapeta/ui-web-components';

import {BlockTypeProvider, IdentityService, ResourceTypeProvider} from '@kapeta/ui-web-context';

import {parseKapetaUri} from '@kapeta/nodejs-utils';

import type {IResourceTypeProvider, SchemaKind} from '@kapeta/ui-web-types';
import {ItemType, ResourceRole} from '@kapeta/ui-web-types';
import {BlockDefinition, Resource, Connection} from "@kapeta/schemas";

import {ErrorBoundary} from 'react-error-boundary';
import {useAsync} from 'react-use';
import {cloneDeep} from 'lodash';
import {PlannerContext, PlannerContextData} from '@kapeta/ui-web-plan-editor';
import {BlockInfo, EditItemInfo} from "../../types";

import './ItemEditorPanel.less';

function onMappingChanged(change) {
    console.log('mapping change', change);
}

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


// Higher-order-component to allow us to use hooks for data loading (not possible in class components)
const withNamespaces = (ChildComponent) => {
    return (props) => {
        const {value: namespaces, loading} = useAsync(async () => {
            const identity = await IdentityService.getCurrent();
            const memberships = await IdentityService.getMemberships(identity.id);
            return [identity.handle, ...memberships.map((membership) => membership.identity.handle)];
        });
        return (
            <SimpleLoader loading={loading}>
                <ChildComponent {...props} namespaces={namespaces || []}/>
            </SimpleLoader>
        );
    };
};
const AutoLoadAssetNameInput = withNamespaces(AssetNameInput);

interface BlockFieldsProps {
    data: SchemaKind
}

const BlockFields = ({data}: BlockFieldsProps) => {
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

            <AutoLoadAssetNameInput
                name="metadata.name"
                label="Name"
                help={'The name of this block - e.g. "myhandle/my-block"'}
            />

            <FormField name="metadata.title" label="Title" help="This blocks human-friendly title"/>
        </>
    );
}

interface InnerFormProps {
    planner: PlannerContextData,
    info: EditItemInfo
}

const InnerForm = ({planner, info}: InnerFormProps) => {
    if (info.type === ItemType.CONNECTION) {
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
        const mappingField = useFormContextField('mapping');

        return (
            <MappingComponent
                title="mapping-editor"
                source={source}
                target={target}
                sourceEntities={fromBlock?.spec.entities?.types ?? []}
                targetEntities={toBlock?.spec.entities?.types ?? []}
                value={mappingField.get(connection.mapping)}
                onDataChanged={(change) => {
                    mappingField.set(change.data);
                }}
            />
        );
    }

    if (info.type === ItemType.BLOCK) {
        const data = info.item as BlockInfo;
        const kindField = useFormContextField('kind');
        const kind = kindField.get(data.block.kind);
        const BlockTypeConfig = BlockTypeProvider.get(kind);

        if (!BlockTypeConfig.componentType) {
            return <div key={data.instance.block.ref}>
                <BlockFields data={data.block}/>
            </div>;
        }

        return (
            <div key={kind}>
                <BlockFields data={data.block}/>
                <ErrorBoundary
                    fallbackRender={(props) => (
                        <div>
                            Failed to render block type: {kind}. <br/>
                            Error: {props.error.message}
                        </div>
                    )}
                >
                    <BlockTypeConfig.componentType creating={info.creating}/>
                </ErrorBoundary>
            </div>
        );
    }

    if (info.type === ItemType.RESOURCE) {
        const data = info.item.resource as Resource;
        const kindField = useFormContextField('kind');
        const kind = kindField.get(data.kind) || data.kind;
        let resourceType:IResourceTypeProvider|null = null;
        try {
            resourceType = ResourceTypeProvider.get(kind);

            if (!resourceType.componentType) {
                return null;
            }
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
                {resourceType?.componentType &&
                    <ErrorBoundary
                        resetKeys={[kind, info.item]}
                        fallbackRender={(props) => (
                            <div>
                                Failed to render resource type: {kind}. <br/>
                                Error: {props.error.message}
                            </div>
                        )} >
                        <resourceType.componentType
                            key={kind}
                            block={info.item.block}
                            creating={info.creating}
                        />
                    </ErrorBoundary>
                }
            </>
        );
    }

    return null;
}

interface Props {
    info?: EditItemInfo | null;
    open: boolean;
    onClosed: () => void;
}

export const EditorPanels: React.FC<Props> = (props) => {
    const planner = useContext(PlannerContext);
    // callbacks
    const saveAndClose = (data: any) => {
        switch (props.info?.type) {
            case ItemType.CONNECTION:
                planner.updateConnectionMapping(data as Connection);
                break;
            case ItemType.BLOCK:
                planner.updateBlockDefinition(props.info.item.instance.block.ref, data as BlockDefinition);
                break;
            case ItemType.RESOURCE:
                const consumerIx = props.info.item.block.spec.consumers?.indexOf(props.info.item.resource) ?? -1;
                const providerIx = props.info.item.block.spec.providers?.indexOf(props.info.item.resource) ?? -1;
                const block = cloneDeep(props.info.item.block) as BlockDefinition;
                if (consumerIx > -1) {
                    block.spec.consumers![consumerIx] = data as Resource;
                } else if (providerIx > -1) {
                    block.spec.providers![providerIx] = data as Resource;
                } else {
                    console.warn('Could not find resource in block');
                    return;
                }
                planner.updateBlockDefinition(props.info.item.ref, block);
                break;
        }
        props.onClosed();
    };

    const onPanelCancel = () => {
        if (props.info?.creating) {
            // We remove the item if it was created in this session and then cancelled
            switch (props.info?.type) {
                case ItemType.CONNECTION:
                    planner.removeConnection(props.info.item);
                    break;
                case ItemType.BLOCK:
                    planner.removeBlockInstance(props.info.item.instance.id);
                    break;
                case ItemType.RESOURCE:
                    const resource = props.info.item.resource;
                    const resourceType = ResourceTypeProvider.get(resource.kind);
                    planner.removeResource(props.info.item.ref, resource.metadata.name, resourceType.role);
                    break;
            }
        }
        props.onClosed();
    };

    const initialValue = useMemo(() => {
        switch (props.info?.type) {
            case ItemType.CONNECTION:
                return cloneDeep(props.info.item);
            case ItemType.BLOCK:
                return cloneDeep(props.info.item.block);
            case ItemType.RESOURCE:
                return cloneDeep(props.info.item.resource);
        }

        return {};
    }, [props.info]);


    const panelHeader = () => {
        if (!props.info) {
            return '';
        }
        return `Edit ${props.info.type.toLowerCase()}`;
    };

    return (
        <SidePanel title={panelHeader()}
                   size={PanelSize.large}
                   open={props.open}
                   onClose={onPanelCancel}>
            {props.info && (
                <div className="item-editor-panel">
                    <FormContainer
                        initialValue={initialValue}
                        onSubmitData={(data) => saveAndClose(data)}
                    >
                        <div className="item-form">
                            <InnerForm planner={planner} info={props.info}/>
                        </div>
                        <FormButtons>
                            <Button
                                width={70}
                                type={ButtonType.BUTTON}
                                style={ButtonStyle.DANGER}
                                onClick={onPanelCancel}
                                text="Cancel"
                            />
                            <Button width={70} type={ButtonType.SUBMIT} style={ButtonStyle.PRIMARY} text="Save"/>
                        </FormButtons>
                    </FormContainer>
                </div>
            )}
            {!props.info && <div>No item selected</div>}
        </SidePanel>
    );
};
