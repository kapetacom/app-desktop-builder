import { parseKapetaUri } from '@kapeta/nodejs-utils';
import {
    getLocalRefForBlockDefinition,
    Planner,
    PlannerContext,
    PlannerMode,
    PlannerResourceDrawer,
    withPlannerContext,
    randomUUID,
} from '@kapeta/ui-web-plan-editor';
import React, {
    ForwardedRef,
    forwardRef,
    useContext,
    useEffect,
    useState,
} from 'react';
import { Asset, IResourceTypeProvider } from '@kapeta/ui-web-types';
import { useAsyncFn } from 'react-use';
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

        const [configurations, reloadConfiguration] = useAsyncFn(async () => {
            return getInstanceConfigs(props.systemId);
        }, [props.systemId]);

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
                            await reloadConfiguration();
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
                        configurations={configurations.value}
                        onCreateBlock={(block, instance) => {
                            const asset: Asset<BlockDefinition> = {
                                ref: normalizeKapetaUri(
                                    getLocalRefForBlockDefinition(block)
                                ),
                                data: block,
                                version: 'local',
                                editable: true,
                                path: '',
                                ymlPath: '',
                                exists: false,
                                kind: block.kind,
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
