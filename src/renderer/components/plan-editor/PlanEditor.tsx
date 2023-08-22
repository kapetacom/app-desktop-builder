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
} from '@kapeta/ui-web-plan-editor';
import React, {
    ForwardedRef,
    forwardRef,
    useContext,
    useMemo,
    useState,
} from 'react';
import { IResourceTypeProvider } from '@kapeta/ui-web-types';
import { useAsyncRetry } from 'react-use';
import { PlanEditorTopMenu } from './PlanEditorTopMenu';
import { usePlanEditorActions } from './PlanEditorActions';
import { BlockConfigurationPanel } from './panels/block-configuration/BlockConfigurationPanel';
import {
    ConfigureItemInfo,
    DataEntityType,
    EditItemInfo,
    InspectItemInfo,
    InstanceInfo,
} from './types';
import { EditorPanels } from './panels/editor/EditorPanels';
import { InspectorPanels } from './panels/InspectorPanels';
import './PlanEditor.less';
import { getInstanceConfigs } from '../../api/LocalConfigService';
import { toClass } from '@kapeta/ui-web-utils';
import { useKapetaContext } from '../../hooks/contextHook';
import { ThemeProvider } from '@mui/material';
import { kapetaLight } from '../../Theme';
import { BlockCreatorPanel } from './panels/BlockCreatorPanel';
import { BlockDefinition } from '@kapeta/schemas';
import { normalizeKapetaUri } from '../../utils/planContextLoader';
import { BlockTypeProvider } from '@kapeta/ui-web-context';

interface Props {
    systemId: string;
    resourceAssets: IResourceTypeProvider[];
    instanceInfos?: InstanceInfo[];
    ref: ForwardedRef<HTMLDivElement>;
}

export const PlanEditor = withPlannerContext(
    forwardRef((props: Props, ref: ForwardedRef<HTMLDivElement>) => {
        const uri = parseKapetaUri(props.systemId);
        const planner = useContext(PlannerContext);
        const kapetaContext = useKapetaContext();

        const [configInfo, setConfigInfo] = useState<ConfigureItemInfo | null>(
            null
        );
        const [inspectInfo, setInspectInfo] = useState<InspectItemInfo | null>(
            null
        );
        const [editInfo, setEditInfo] = useState<EditItemInfo | null>(null);

        const actions = usePlanEditorActions(
            planner,
            props.instanceInfos ?? [],
            {
                inspect: (info) => {
                    setInspectInfo(info);
                },
                configure: (info) => {
                    setConfigInfo(info);
                },
                edit: (info) => {
                    setEditInfo(info);
                },
            }
        );

        const configFromInstances = useAsyncRetry(async () => {
            return await getInstanceConfigs(props.systemId);
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
                    const ref = normalizeKapetaUri(instance.block.ref);
                    const block = planner.getBlockByRef(ref);
                    if (!block) {
                        console.log('Block not found', ref);
                        return;
                    }

                    const kind = normalizeKapetaUri(block.kind);

                    const typeProvider = BlockTypeProvider.get(kind);
                    if (!typeProvider.createDefaultConfig) {
                        return;
                    }

                    console.log('Got default for block', kind);

                    config[instance.id] = {
                        ...typeProvider.createDefaultConfig(block, instance),
                        ...currentConfig,
                    };
                } catch (e) {
                    console.warn(
                        'Failed to create default config for block',
                        e
                    );
                }
            });

            console.log('recreated config', config);
            return config;
        }, [
            configFromInstances.value,
            configFromInstances.loading,
            planner.plan,
            planner.blockAssets,
        ]);

        const readonly = planner.mode !== PlannerMode.EDIT;

        const containerClass = toClass({
            'plan-editor': true,
            readonly: readonly,
        });

        const creatingNewBlock = !!(
            editInfo?.creating && editInfo.type === DataEntityType.BLOCK
        );

        return (
            <ThemeProvider theme={kapetaLight}>
                <div className={containerClass} ref={ref}>
                    <PlanEditorTopMenu
                        readonly={readonly}
                        version={uri.version}
                        systemId={props.systemId}
                    />

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
                                kapetaContext.blockHub.open(
                                    planner.asset!,
                                    (selection) => {
                                        selection.forEach((asset, i) => {
                                            const ref = normalizeKapetaUri(
                                                asset.content.metadata.name +
                                                    ':' +
                                                    asset.version
                                            );
                                            planner.addBlockInstance({
                                                name:
                                                    asset.content.metadata
                                                        .title ??
                                                    parseKapetaUri(ref).name,
                                                id: randomUUID(),
                                                block: {
                                                    ref,
                                                },
                                                dimensions: {
                                                    top: 50 + i * 150,
                                                    left: 50,
                                                    width: 0,
                                                    height: 0,
                                                },
                                            });
                                        });
                                    }
                                );
                            }}
                        />
                    )}

                    <Planner
                        actions={actions}
                        systemId={props.systemId}
                        configurations={configurations}
                        onCreateBlock={(block, instance) => {
                            const asset: AssetInfo<BlockDefinition> = {
                                ref: normalizeKapetaUri(
                                    getLocalRefForBlockDefinition(block)
                                ),
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
            </ThemeProvider>
        );
    })
);
