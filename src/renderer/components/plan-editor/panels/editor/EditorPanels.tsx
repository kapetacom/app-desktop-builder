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
} from '@kapeta/ui-web-components';

import {BlockTypeProvider, IdentityService, ResourceTypeProvider} from '@kapeta/ui-web-context';

import {parseKapetaUri} from '@kapeta/nodejs-utils';

import type {BlockConnectionSpec, SchemaKind} from '@kapeta/ui-web-types';
import {ItemType, ResourceKind, ResourceRole} from '@kapeta/ui-web-types';

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
        const { value: namespaces, loading } = useAsync(async () => {
            const identity = await IdentityService.getCurrent();
            const memberships = await IdentityService.getMemberships(identity.id);
            return [identity.handle, ...memberships.map((membership) => membership.identity.handle)];
        });
        return (
            <SimpleLoader loading={loading}>
                <ChildComponent {...props} namespaces={namespaces || []} />
            </SimpleLoader>
        );
    };
};
const AutoLoadAssetNameInput = withNamespaces(AssetNameInput);

interface BlockFieldsProps {
    data: SchemaKind
}

const BlockFields = ({data}:BlockFieldsProps) => {
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

            <FormField name="metadata.title" label="Title" help="This blocks human-friendly title" />
        </>
    );
}

interface InnerFormProps {
    planner: PlannerContextData,
    info: EditItemInfo
}

const InnerForm = ({planner,info}:InnerFormProps) => {
    if (info.type === ItemType.CONNECTION) {
        const connection = info.item as BlockConnectionSpec;

        const source = planner.getResourceByBlockIdAndName(
            connection.from.blockId,
            connection.from.resourceName,
            ResourceRole.PROVIDES
        );

        const target = planner.getResourceByBlockIdAndName(
            connection.to.blockId,
            connection.to.resourceName,
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

        const fromBlock = planner.getBlockById(connection.from.blockId);
        const toBlock = planner.getBlockById(connection.to.blockId);

        return (
            <MappingComponent
                title="mapping-editor"
                source={source}
                target={target}
                sourceEntities={fromBlock?.spec.entities?.types ?? []}
                targetEntities={toBlock?.spec.entities?.types ?? []}
                value={connection.mapping}
                onDataChanged={(change) => onMappingChanged(change)}
            />
        );
    }

    if (info.type === ItemType.BLOCK) {
        const data = info.item as BlockInfo;

        const BlockTypeConfig = BlockTypeProvider.get(data.block.kind);

        if (!BlockTypeConfig.componentType) {
            return <div key={data.instance.block.ref}>
                <BlockFields data={data.block} />
            </div>;
        }

        return (
            <div key={data.instance.block.ref}>
                <BlockFields data={data.block} />
                <ErrorBoundary
                    fallbackRender={(props) => (
                        <div>
                            Failed to render block type: {data.block.kind}. <br />
                            Error: {props.error.message}
                        </div>
                    )}
                >
                    <BlockTypeConfig.componentType creating={info.creating} />
                </ErrorBoundary>
            </div>
        );
    }

    if (info.type === ItemType.RESOURCE) {
        const data = info.item as ResourceKind;
        const resourceType = ResourceTypeProvider.get(data.kind);

        if (!resourceType.componentType) {
            return null;
        }

        const dataKindUri = parseKapetaUri(data.kind);
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
                <ErrorBoundary
                    fallbackRender={(props) => (
                        <div>
                            Failed to render resource type: {data.kind}. <br />
                            Error: {props.error.message}
                        </div>
                    )}
                >
                    <resourceType.componentType
                        key={data.kind}
                        // TODO: make resource componentType accept ResourceKind/Schemakind
                        // @ts-ignore
                        block={data}
                        creating={info.creating}
                    />
                </ErrorBoundary>
            </>
        );
    }

    return null;
}

interface Props {
    info?: EditItemInfo|null;
    open: boolean;
    onSubmit: (data: SchemaKind) => void;
    onClosed: () => void;
}

export const EditorPanels: React.FC<Props> = (props) => {
    const planner = useContext(PlannerContext);
    // callbacks
    const saveAndClose = (data: SchemaKind) => {
        props.onSubmit(data);
        props.onClosed();
    };
    const onPanelCancel = () => {
        props.onClosed();
    };

    const initialValue = useMemo(() => {
        if (props.info?.type === ItemType.CONNECTION) {
            return cloneDeep(props.info.item);
        }
        if (props.info?.type === ItemType.BLOCK) {
            return cloneDeep(props.info.item.block);
        }
        if (props.info?.type === ItemType.RESOURCE) {
            return cloneDeep(props.info.item);
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
                        // Do we need editableItem state?
                        initialValue={initialValue}
                        onSubmitData={(data) => saveAndClose(data as SchemaKind)}
                    >
                        <div className="item-form">
                            <InnerForm planner={planner} info={props.info} />
                        </div>
                        <FormButtons>
                            <Button
                                width={70}
                                type={ButtonType.BUTTON}
                                style={ButtonStyle.DANGER}
                                onClick={onPanelCancel}
                                text="Cancel"
                            />
                            <Button width={70} type={ButtonType.SUBMIT} style={ButtonStyle.PRIMARY} text="Save" />
                        </FormButtons>
                    </FormContainer>
                </div>
            )}
            {!props.info && <div>No item selected</div>}
        </SidePanel>
    );
};
