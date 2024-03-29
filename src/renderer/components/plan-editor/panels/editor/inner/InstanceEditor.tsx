/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { BlockInfo } from '../../../types';
import React, { useCallback, useMemo } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import * as _kapeta_schemas from '@kapeta/schemas';
import { IBlockTypeProvider, SchemaKind } from '@kapeta/ui-web-types';
import { Alert, Box, Stack, Tab, Tabs } from '@mui/material';
import { useKapetaContext } from '../../../../../hooks/contextHook';
import { useNamespacesForField } from '../../../../../hooks/useNamespacesForField';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { fromTypeProviderToAssetType } from '../../../../../utils/assetTypeConverters';
import { BlockTypeProvider } from '@kapeta/ui-web-context';
import {
    AssetNameInput,
    AssetVersionSelector,
    ConfigurationEditor,
    DataTypeEditor,
    DSL_LANGUAGE_ID,
    DSLEntity,
    FormField,
    FormFieldType,
    useFormContextField,
    InfoBox,
    createVerticalScrollShadow,
    useIsFormSubmitAttempted,
    DSLDataType,
} from '@kapeta/ui-web-components';

import { DSLConverters, KAPLANG_ID, KAPLANG_VERSION } from '@kapeta/kaplang-core';
import { toDataTypes } from '../../../../../utils/dsl-filter';
import { useDSLEntityIncludes } from '@kapeta/ui-web-plan-editor';

function filterEmpty<T>(value: T | null | undefined): boolean {
    return value !== null && value !== undefined;
}

interface BlockFieldsProps {
    data: SchemaKind;
}

const BlockFields = ({ data }: BlockFieldsProps) => {
    const context = useKapetaContext();
    const namespaces = useNamespacesForField('metadata.name');
    const kindUri = parseKapetaUri(data.kind);

    const assetTypes = useMemo(() => {
        const versions = BlockTypeProvider.getVersionsFor(kindUri.fullName);
        return versions.map((version) => {
            const id = `${kindUri.fullName}:${version}`;
            const typeProvider = BlockTypeProvider.get(id);
            return fromTypeProviderToAssetType(typeProvider);
        });
    }, [kindUri.fullName]);

    return (
        <>
            <AssetVersionSelector
                name="kind"
                label="Type"
                validation={['required']}
                help="The block type and version"
                assetTypes={assetTypes}
            />

            <AssetNameInput
                name="metadata.name"
                label="Name"
                validation={['required']}
                namespaces={namespaces}
                defaultValue={context.activeContext?.identity?.handle ?? 'local'}
                help={'The name of this block - e.g. "myhandle/my-block"'}
            />

            <FormField
                name="metadata.visibility"
                type={FormFieldType.ENUM}
                validation={['required']}
                options={{
                    public: 'Public',
                    private: 'Private',
                }}
                label="Visiblity"
                help="Determine if your Block is available on Block Hub, The Kapeta Market Place"
            />

            <FormField name="metadata.title" label="Title" help="This blocks human-friendly title" />

            <FormField
                name="metadata.description"
                type={FormFieldType.TEXT}
                label="Description"
                help="Give your block a longer description"
            />
        </>
    );
};

interface Props {
    creating: boolean;
    data: BlockInfo;
    kind: string;
    blockTypeConfig: IBlockTypeProvider<_kapeta_schemas.BlockDefinition>;
}

export const InstanceEditor = (props: Props) => {
    const data = props.data;
    const kind = props.kind;
    const BlockTypeConfig = props.blockTypeConfig;

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

    const formSubmitAttempted = useIsFormSubmitAttempted();

    const entitiesField = useFormContextField('spec.entities');
    const configurationField = useFormContextField('spec.configuration');
    const [entitiesError, setEntitiesError] = React.useState<string | null>(null);
    const [configurationError, setConfigurationError] = React.useState<string | null>(null);

    const hasEntities = Boolean(BlockTypeConfig.definition.spec.schema?.properties?.hasOwnProperty('entities'));
    const hasConfigSchema = Boolean(
        BlockTypeConfig.definition.spec.schema?.properties?.hasOwnProperty('configuration')
    );
    const EditorComponent = BlockTypeConfig.editorComponent;
    type PanelId = 'info' | 'edit' | 'entities' | 'parameters';
    const [currentTabId, setCurrentTabId] = React.useState<PanelId>('info');

    const dataTypeIncludes = useDSLEntityIncludes(data.block.kind, data.block.spec.target?.kind);

    const renderConfiguration = () => {
        const configuration = configurationField.get();
        const result = {
            code: configuration?.source?.value || '',
            entities: configuration?.types?.map
                ? configuration?.types?.filter(filterEmpty).map(DSLConverters.fromSchemaEntity)
                : [],
        };

        return (
            <Stack direction={'column'} sx={{ height: '100%' }}>
                <InfoBox>Define configuration data types for this block</InfoBox>
                <ConfigurationEditor
                    value={result}
                    onError={(err: any) => {
                        configurationField.invalid();
                        setConfigurationError(err.message);
                    }}
                    onChange={(result) => {
                        result.entities && setConfiguration(result.code, result.entities);
                        configurationField.valid();
                        setConfigurationError(null);
                    }}
                />
                {configurationError && formSubmitAttempted && (
                    <Alert sx={{ mt: 1 }} severity={'error'}>
                        {configurationError}
                    </Alert>
                )}
            </Stack>
        );
    };

    const setConfiguration = (code: string, results: DSLEntity[]) => {
        const types = results.map((e) => DSLConverters.toSchemaEntity(e, toDataTypes(results)));
        const configuration = {
            types,
            source: {
                type: KAPLANG_ID,
                version: KAPLANG_VERSION,
                value: code,
            },
        };
        configurationField.set(configuration);
    };

    const renderEntities = () => {
        const entities = entitiesField.get();

        const result = {
            code: entities?.source?.value || '',
            entities: entities?.types?.map
                ? entities?.types?.filter(filterEmpty).map(DSLConverters.fromSchemaEntity)
                : [],
        };

        return (
            <Stack direction={'column'} sx={{ height: '100%' }}>
                <InfoBox>Entities define external data types to be used by the resources for this block</InfoBox>
                <DataTypeEditor
                    value={result}
                    validTypes={dataTypeIncludes}
                    onError={(err: any) => {
                        entitiesField.invalid();
                        setEntitiesError(err.message);
                        console.warn('Failed while processing', err);
                    }}
                    onChange={(result) => {
                        result.entities && setEntities(result.code, result.entities);
                        entitiesField.valid();
                        setEntitiesError(null);
                    }}
                />
                {entitiesError && formSubmitAttempted && (
                    <Alert sx={{ mt: 1 }} severity={'error'}>
                        {entitiesError}
                    </Alert>
                )}
            </Stack>
        );
    };

    const setEntities = (code: string, results: DSLEntity[]) => {
        const types = results.map((entity) => DSLConverters.toSchemaEntity(entity, results as DSLDataType[]));
        const entities = {
            types,
            source: {
                type: KAPLANG_ID,
                version: KAPLANG_VERSION,
                value: code,
            },
        };
        entitiesField.set(entities);
    };

    return (
        <Stack
            direction={'column'}
            sx={{
                height: '100%',
                overflow: 'hidden',
                '& > .editor-tab-page': {
                    flex: 1,
                    ...createVerticalScrollShadow(0.1),
                },
            }}
        >
            <Tabs value={currentTabId} variant={'fullWidth'} onChange={(_, newValue) => setCurrentTabId(newValue)}>
                <Tab label={'Info'} value={'info'} />
                {EditorComponent && <Tab label={'Settings'} value={'edit'} />}
                {!props.creating && hasEntities && <Tab label={'Entities'} value={'entities'} />}
                {!props.creating && hasConfigSchema && <Tab label={'Parameters'} value={'parameters'} />}
            </Tabs>
            <Box
                className={'editor-tab-page'}
                sx={{
                    display: currentTabId === 'info' ? 'block' : 'none',
                }}
            >
                <BlockFields data={data.block} />
            </Box>
            {EditorComponent && (
                <Box
                    className={'editor-tab-page'}
                    sx={{
                        display: currentTabId === 'edit' ? 'block' : 'none',
                    }}
                >
                    <ErrorBoundary fallbackRender={getErrorFallback(kind)}>
                        {/* @ts-ignore React types are messy */}
                        <EditorComponent block={data.block} creating={props.creating} />
                    </ErrorBoundary>
                </Box>
            )}
            <Box
                className={'editor-tab-page'}
                sx={{
                    display: currentTabId === 'entities' ? 'block' : 'none',
                }}
            >
                {renderEntities()}
            </Box>
            <Box
                className={'editor-tab-page'}
                sx={{
                    overflow: 'auto',
                    display: currentTabId === 'parameters' ? 'block' : 'none',
                }}
            >
                {renderConfiguration()}
            </Box>
        </Stack>
    );
};
