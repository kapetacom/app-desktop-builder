/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useContext, useEffect, useMemo } from 'react';
import {
    FormButtons,
    FormContainer,
    FormField,
    FormFieldType,
    SimpleLoader,
    EntityEditorForm,
    AssetVersionSelector,
    AssetVersionSelectorEntry,
} from '@kapeta/ui-web-components';

import { BlockTypeProvider } from '@kapeta/ui-web-context';

import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { BlockInstance } from '@kapeta/schemas';
import {
    createGlobalConfigurationFromEntities,
    PlannerContext,
    PlannerMode,
    PlannerSidebar,
    resolveConfigurationFromDefinition,
} from '@kapeta/ui-web-plan-editor';

import './BlockConfigurationPanel.less';
import { useAsyncFn } from 'react-use';
import { getInstanceConfig, setInstanceConfig } from '../../../../api/LocalConfigService';
import { Box, Button, Tab, Tabs } from '@mui/material';
import { normalizeKapetaUri } from '../../../../utils/planContextLoader';
import { getAssetTitle } from '../../helpers';

type Options = { [key: string]: string };

interface BlockConfigurationData {
    blockRef: string;
    name: string;
    configuration?: { [key: string]: string };
}

interface Props {
    systemId: string;
    instance?: BlockInstance;
    open: boolean;
    onClosed: () => void;
}

export const BlockConfigurationPanel = (props: Props) => {
    const planner = useContext(PlannerContext);

    const panelHeader = () => {
        if (!props.instance) {
            return '';
        }

        return `Configure ${props.instance?.name}`;
    };

    const [instanceConfig, reloadConfig] = useAsyncFn(async () => {
        if (!props.instance?.id) {
            return undefined;
        }
        return getInstanceConfig(props.systemId, props.instance!.id);
    }, [props.systemId, props.instance?.id]);

    useEffect(() => {
        if (props.open) {
            reloadConfig();
        }
    }, [props.systemId, planner.plan, props.open, reloadConfig]);

    const block = useMemo(() => {
        if (!props.instance?.block.ref) {
            return undefined;
        }
        return planner.getBlockByRef(props.instance.block.ref);
    }, [props.instance?.block.ref, planner.getBlockByRef]);

    const typeProvider = useMemo(() => {
        if (!block) {
            return undefined;
        }
        return BlockTypeProvider.get(block.kind);
    }, [block]);

    const data: BlockConfigurationData = useMemo<BlockConfigurationData>(() => {
        let defaultConfig = {};
        if (block && typeProvider?.createDefaultConfig) {
            defaultConfig = typeProvider.createDefaultConfig(block, props.instance!);
        }

        if (!props.instance) {
            return {
                blockRef: '',
                name: '',
                configuration: {
                    ...defaultConfig,
                },
            };
        }

        const config = {
            ...defaultConfig,
            ...instanceConfig.value,
        };

        const ref = normalizeKapetaUri(props.instance.block.ref);
        return {
            blockRef: ref,
            name: props.instance.name,
            configuration: resolveConfigurationFromDefinition(
                block?.spec?.configuration,
                config,
                props.instance.defaultConfiguration
            ),
        };
    }, [props.instance, instanceConfig.value, typeProvider, block]);

    const { blockAssets } = useContext(PlannerContext);

    const assetTypes: AssetVersionSelectorEntry[] = useMemo(() => {
        if (!props.instance?.block.ref) {
            return [];
        }

        const blockUri = parseKapetaUri(props.instance?.block.ref);

        return blockAssets
            .filter((asset) => {
                const uri = parseKapetaUri(asset.ref);
                return uri.fullName === blockUri.fullName;
            })
            .map((asset) => {
                return {
                    kind: asset.content.kind,
                    ref: asset.ref,
                    icon: asset.content.spec.icon,
                    title: getAssetTitle(asset),
                };
            });
    }, [props.instance?.block.ref, blockAssets]);

    const onSave = async (blockData: BlockConfigurationData) => {
        if (!props.instance?.id) {
            return;
        }

        planner.updateBlockInstance(props.instance.id, (instance) => {
            const defaultConfig = createGlobalConfigurationFromEntities(
                block?.spec?.configuration,
                blockData.configuration
            );

            return {
                ...instance,
                block: {
                    ...instance.block,
                    ref: normalizeKapetaUri(blockData.blockRef),
                },
                name: blockData.name,
                defaultConfiguration: defaultConfig,
            };
        });

        await setInstanceConfig(props.systemId, props.instance.id, blockData.configuration!);
        await reloadConfig();

        props.onClosed();
    };

    const configReadOnly = planner.mode === PlannerMode.VIEW;
    const planReadOnly = configReadOnly || planner.mode === PlannerMode.CONFIGURATION;

    const [currentTab, setCurrentTab] = React.useState('general');

    const showConfigTab =
        !!(typeProvider && typeProvider.configComponent && block && props.instance) ||
        !!(block?.spec?.configuration?.types?.length && block?.spec?.configuration?.types?.length > 0);

    useEffect(() => {
        if (props.open) {
            // Reset to general tab when opening
            setCurrentTab('general');
        }
    }, [props.open]);

    return (
        <PlannerSidebar title={panelHeader()} open={props.open} onClose={props.onClosed}>
            <SimpleLoader
                loading={!blockAssets || instanceConfig.loading}
                key={props.instance?.block.ref ?? 'unknown-block'}
                text="Loading details... Please wait"
            >
                <div className="block-configuration-panel">
                    <FormContainer initialValue={data} onSubmitData={onSave}>
                        <Tabs
                            orientation="horizontal"
                            value={currentTab}
                            onChange={(evt, newTabId) => setCurrentTab(newTabId)}
                        >
                            <Tab value={'general'} label="General" />
                            {showConfigTab && <Tab value={'configuration'} label="Configuration" />}
                        </Tabs>
                        {currentTab === 'general' && (
                            <Box>
                                <FormField
                                    name="name"
                                    label="Instance name"
                                    help="This related only to the instance of the block and not the block itself."
                                    readOnly={planReadOnly}
                                    type={FormFieldType.STRING}
                                />

                                <AssetVersionSelector
                                    name="blockRef"
                                    label="Resource kind"
                                    validation={['required']}
                                    help="The block type and version of this instance"
                                    readOnly={planReadOnly}
                                    assetTypes={assetTypes}
                                />
                            </Box>
                        )}

                        {}

                        {currentTab === 'configuration' &&
                            block &&
                            (typeProvider?.configComponent && props.instance ? (
                                <typeProvider.configComponent
                                    block={block}
                                    instance={props.instance}
                                    readOnly={configReadOnly}
                                />
                            ) : (
                                <EntityEditorForm
                                    instances={planner.plan?.spec.blocks?.map((blockInstance) => {
                                        const blockDef = planner.getBlockById(blockInstance.id);
                                        return {
                                            name: blockInstance.name,
                                            id: blockInstance.id,
                                            providers:
                                                blockDef?.spec.providers?.map((provider) => {
                                                    return {
                                                        name: provider.metadata.name,
                                                        portType: provider?.spec?.port?.type,
                                                    };
                                                }) ?? [],
                                        };
                                    })}
                                    entities={block.spec?.configuration?.types ?? []}
                                    name="configuration"
                                />
                            ))}

                        <FormButtons>
                            <Button variant={'contained'} color={'error'} onClick={props.onClosed}>
                                Cancel
                            </Button>
                            <Button variant={'contained'} disabled={configReadOnly} color={'primary'} type="submit">
                                Save
                            </Button>
                        </FormButtons>
                    </FormContainer>
                </div>
            </SimpleLoader>
        </PlannerSidebar>
    );
};
