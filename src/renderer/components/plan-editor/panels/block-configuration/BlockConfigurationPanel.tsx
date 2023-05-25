import React, { useContext, useEffect, useMemo } from 'react';
import {
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
    TabContainer,
    TabPage,
    EntityEditorForm,
} from '@kapeta/ui-web-components';

import { BlockTypeProvider } from '@kapeta/ui-web-context';

import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { BlockInstance } from '@kapeta/schemas';
import {
    BlockConfigurationData,
    PlannerContext,
    PlannerMode,
} from '@kapeta/ui-web-plan-editor';

import './BlockConfigurationPanel.less';
import { useAsyncFn } from 'react-use';
import {
    getInstanceConfig,
    setInstanceConfig,
} from '../../../../api/LocalConfigService';

type Options = { [key: string]: string };

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
        return planner.getBlockByRef.call(null, props.instance.block.ref);
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
            defaultConfig = typeProvider.createDefaultConfig!(
                block,
                props.instance!
            );
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

        await setInstanceConfig(
            props.systemId,
            props.instance.id,
            blockData.configuration!
        );
        await reloadConfig();

        props.onClosed();
    };

    const readOnly = planner.mode !== PlannerMode.EDIT;
    const hasConfigComponent = !!(typeProvider && typeProvider.configComponent);

    return (
        <SidePanel
            title={panelHeader()}
            size={PanelSize.large}
            open={props.open}
            onClose={props.onClosed}
        >
            <SimpleLoader
                loading={!blockAssets || instanceConfig.loading}
                key={props.instance?.block.ref ?? 'unknown-block'}
                text="Loading details... Please wait"
            >
                <div className="block-configuration-panel">
                    <FormContainer initialValue={data} onSubmitData={onSave}>
                        <TabContainer>
                            <TabPage id="general" title="General">
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
                            </TabPage>

                            {typeProvider &&
                                typeProvider.configComponent &&
                                block &&
                                props.instance && (
                                    <TabPage
                                        id="configuration"
                                        title="Configuration"
                                    >
                                        <typeProvider.configComponent
                                            block={block}
                                            instance={props.instance}
                                            readOnly={readOnly}
                                        />
                                    </TabPage>
                                )}

                            {!hasConfigComponent &&
                                (block?.spec.configuration?.types?.length ||
                                    0) > 0 && (
                                    <TabPage
                                        id="configuration"
                                        title="Configuration"
                                    >
                                        <EntityEditorForm
                                            entities={
                                                block!.spec.configuration!
                                                    .types!
                                            }
                                            name="configuration"
                                        />
                                    </TabPage>
                                )}
                        </TabContainer>

                        <FormButtons>
                            <Button
                                width={70}
                                type={ButtonType.BUTTON}
                                style={ButtonStyle.DANGER}
                                onClick={props.onClosed}
                                text="Cancel"
                            />
                            <Button
                                width={70}
                                disabled={readOnly}
                                type={ButtonType.SUBMIT}
                                style={ButtonStyle.PRIMARY}
                                text="Save"
                            />
                        </FormButtons>
                    </FormContainer>
                </div>
            </SimpleLoader>
        </SidePanel>
    );
};
