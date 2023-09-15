import { parseKapetaUri } from '@kapeta/nodejs-utils';
import {
    getLocalRefForBlockDefinition,
    Planner,
    PlannerContext,
    PlannerMode,
    PlannerResourceDrawer,
    withPlannerContext,
    randomUUID,
    AssetInfo,
    resolveConfigurationFromDefinition,
} from '@kapeta/ui-web-plan-editor';
import { ForwardedRef, forwardRef, useContext, useMemo, useState } from 'react';
import { useAsyncRetry } from 'react-use';
import { toClass } from '@kapeta/ui-web-utils';
import { BlockDefinition } from '@kapeta/schemas';
import { BlockTypeProvider } from '@kapeta/ui-web-context';
import { PlanEditorTopMenu } from './PlanEditorTopMenu';
import { usePlanEditorActions } from './PlanEditorActions';
import { BlockConfigurationPanel } from './panels/block-configuration/BlockConfigurationPanel';
import { ConfigureItemInfo, DataEntityType, EditItemInfo, InspectItemInfo, InstanceInfo } from './types';
import { EditorPanels } from './panels/editor/EditorPanels';
import { InspectorPanels } from './panels/InspectorPanels';
import './PlanEditor.less';
import { getInstanceConfigs } from '../../api/LocalConfigService';
import { useKapetaContext } from '../../hooks/contextHook';
import { BlockCreatorPanel } from './panels/BlockCreatorPanel';
import { normalizeKapetaUri } from '../../utils/planContextLoader';

interface Props {
    systemId: string;
    instanceInfos?: InstanceInfo[];
}

export const PlanEditor = withPlannerContext(
    forwardRef((props: Props, ref: ForwardedRef<HTMLDivElement>) => {
        const planner = useContext(PlannerContext);
        const kapetaContext = useKapetaContext();

        const [configInfo, setConfigInfo] = useState<ConfigureItemInfo | null>(null);
        const [inspectInfo, setInspectInfo] = useState<InspectItemInfo | null>(null);
        const [editInfo, setEditInfo] = useState<EditItemInfo | null>(null);

        const actions = usePlanEditorActions(planner, props.instanceInfos ?? [], {
            inspect: (info) => {
                setInspectInfo(info);
            },
            configure: (info) => {
                setConfigInfo(info);
            },
            edit: (info) => {
                setEditInfo(info);
            },
        });

        const configFromInstances = useAsyncRetry(async () => {
            return getInstanceConfigs(props.systemId);
        }, [props.systemId]);

        const configurations = useMemo(() => {
            if (
                !planner.plan ||
                !planner.blockAssets ||
                planner.blockAssets.length === 0 ||
                configFromInstances.loading
            ) {
                return {};
            }
            const config = configFromInstances.value ?? {};
            planner.plan.spec?.blocks?.forEach((instance) => {
                if (!config[instance.id]) {
                    config[instance.id] = {};
                }
                const currentConfig = config[instance.id];
                try {
                    const blockRef = normalizeKapetaUri(instance.block.ref);
                    const block = planner.getBlockByRef.call(null, blockRef);
                    if (!block) {
                        console.log('Block not found', blockRef);
                        return;
                    }

                    const kind = normalizeKapetaUri(block.kind);

                    const typeProvider = BlockTypeProvider.get(kind);
                    let defaultConfig = {};
                    if (typeProvider.createDefaultConfig) {
                        defaultConfig = typeProvider.createDefaultConfig(block, instance);
                    }

                    config[instance.id] = resolveConfigurationFromDefinition(
                        block.spec.configuration,
                        {
                            ...defaultConfig,
                            ...currentConfig,
                        },
                        instance.defaultConfiguration
                    );
                } catch (e) {
                    console.warn('Failed to create default config for block', e);
                }
            });

            return config;
        }, [
            configFromInstances.value,
            configFromInstances.loading,
            planner.plan,
            planner.blockAssets,
            planner.getBlockByRef,
        ]);

        const readonly = planner.mode !== PlannerMode.EDIT;

        const containerClass = toClass({
            'plan-editor': true,
            readonly,
        });

        const creatingNewBlock = !!(editInfo?.creating && editInfo.type === DataEntityType.BLOCK);

        return (
            <div className={containerClass} ref={ref}>
                <PlanEditorTopMenu readonly={readonly} systemId={props.systemId} />

                <BlockConfigurationPanel
                    systemId={props.systemId}
                    instance={configInfo?.item.instance}
                    open={!!configInfo}
                    onClosed={async () => {
                        setConfigInfo(null);
                        configFromInstances.retry();
                    }}
                />

                <InspectorPanels
                    systemId={props.systemId}
                    info={inspectInfo}
                    onClosed={() => {
                        setInspectInfo(null);
                    }}
                />

                <EditorPanels
                    info={editInfo}
                    open={!!editInfo && !creatingNewBlock}
                    onClosed={() => {
                        setEditInfo(null);
                    }}
                />

                <BlockCreatorPanel
                    open={creatingNewBlock}
                    info={editInfo}
                    onClosed={() => {
                        setEditInfo(null);
                    }}
                />

                {!readonly && (
                    <PlannerResourceDrawer
                        onShowMoreAssets={() => {
                            kapetaContext.blockHub.open(planner.asset!, (selection) => {
                                selection.forEach((asset, i) => {
                                    const assetRef = normalizeKapetaUri(
                                        `${asset.content.metadata.name}:${asset.version}`
                                    );
                                    planner.addBlockInstance({
                                        name: asset.content.metadata.title ?? parseKapetaUri(assetRef).name,
                                        id: randomUUID(),
                                        block: {
                                            ref: assetRef,
                                        },
                                        dimensions: {
                                            top: 50 + i * 150,
                                            left: 50,
                                            width: 0,
                                            height: 0,
                                        },
                                    });
                                });
                            });
                        }}
                    />
                )}

                <Planner
                    actions={actions}
                    systemId={props.systemId}
                    configurations={configurations}
                    onCreateBlock={(block, instance) => {
                        const asset: AssetInfo<BlockDefinition> = {
                            ref: normalizeKapetaUri(getLocalRefForBlockDefinition(block)),
                            content: block,
                            version: 'local',
                            editable: true,
                            exists: false,
                        };

                        // We need to add both to show the block in the editor
                        // If user cancels we need to remove both
                        planner.addBlockDefinition(asset);
                        planner.addBlockInstance(instance);

                        setEditInfo({
                            creating: true,
                            type: DataEntityType.BLOCK,
                            item: {
                                asset,
                                instance,
                            },
                        });
                    }}
                />
            </div>
        );
    })
);
