import React, { useContext, useEffect, useMemo } from 'react';
import {
    FormButtons,
    FormContainer,
    FormField,
    FormFieldType,
    SimpleLoader,
    EntityEditorForm,
} from '@kapeta/ui-web-components';

import { BlockTypeProvider } from '@kapeta/ui-web-context';

import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { BlockInstance } from '@kapeta/schemas';
import { PlannerContext, PlannerMode, PlannerSidebar } from '@kapeta/ui-web-plan-editor';

import './BlockConfigurationPanel.less';
import { useAsyncFn } from 'react-use';
import { getInstanceConfig, setInstanceConfig } from '../../../../api/LocalConfigService';
import { Box, Button, Tab, Tabs } from '@mui/material';

type Options = { [key: string]: string };

interface BlockConfigurationData {
    version: string;
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
    console.log('BlockConfigurationPanel.tsx: BlockConfigurationPanel()');
    const planner = useContext(PlannerContext);
    console.log('BlockConfigurationPanel.tsx: BlockConfigurationPanel() planner:', planner);

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
                version: '',
                name: '',
                configuration: {
                    ...defaultConfig,
                },
            };
        }
        const uri = parseKapetaUri(props.instance.block.ref);
        return {
            version: uri.version,
            name: props.instance.name,
            configuration: {
                ...defaultConfig,
                ...instanceConfig.value,
            },
        };
    }, [props.instance, instanceConfig.value, typeProvider, block]);

    const { blockAssets } = useContext(PlannerContext);

    const versionOptions: Options = useMemo(() => {
        if (!props.instance?.block.ref) {
            return {} as Options;
        }

        const blockUri = parseKapetaUri(props.instance?.block.ref);
        const opts: Options = {};
        blockAssets
            .filter((asset) => {
                const uri = parseKapetaUri(asset.ref);
                return uri.fullName === blockUri.fullName;
            })
            .forEach((asset) => {
                opts[asset.version] = asset.version;
            });

        return opts;
    }, [props.instance?.block.ref, blockAssets]);

    const onSave = async (blockData: BlockConfigurationData) => {
        if (!props.instance?.id) {
            return;
        }

        console.log('Saving block configuration', blockData);
        planner.updateBlockInstance(props.instance.id, (instance) => {
            const uri = parseKapetaUri(instance.block.ref);
            uri.version = blockData.version;
            return {
                ...instance,
                block: {
                    ...instance.block,
                    ref: uri.id,
                },
                name: blockData.name,
            };
        });

        await setInstanceConfig(props.systemId, props.instance.id, blockData.configuration!);
        await reloadConfig();

        props.onClosed();
    };

    const readOnly = planner.mode === PlannerMode.VIEW;
    const hasConfigComponent = !!(typeProvider && typeProvider.configComponent);

    const [currentTab, setCurrentTab] = React.useState('general');

    const showConfigTab =
        !!(typeProvider && typeProvider.configComponent && block && props.instance) ||
        !!(block?.spec?.configuration?.types?.length && block?.spec?.configuration?.types?.length > 0);

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
                                    readOnly={readOnly}
                                    type={FormFieldType.STRING}
                                />

                                <FormField
                                    name="version"
                                    label="Version"
                                    options={versionOptions}
                                    help="The current version used by this plan"
                                    readOnly={readOnly}
                                    type={FormFieldType.ENUM}
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
                                    readOnly={readOnly}
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
                            <Button variant={'contained'} disabled={readOnly} color={'primary'} type="submit">
                                Save
                            </Button>
                        </FormButtons>
                    </FormContainer>
                </div>
            </SimpleLoader>
        </PlannerSidebar>
    );
};
