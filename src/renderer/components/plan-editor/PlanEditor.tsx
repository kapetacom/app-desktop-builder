/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { normalizeKapetaUri, parseKapetaUri } from '@kapeta/nodejs-utils';
import {
    AssetInfo,
    getLocalRefForBlockDefinition,
    Planner,
    PlannerContext,
    PlannerMode,
    PlannerDrawer,
    PlannerResourcesList,
    randomUUID,
    resolveConfigurationFromDefinition,
    withPlannerContext,
    usePlanValidation,
} from '@kapeta/ui-web-plan-editor';
import { ForwardedRef, forwardRef, useContext, useMemo, useState } from 'react';
import { IResourceTypeProvider } from '@kapeta/ui-web-types';
import { useAsyncRetry } from 'react-use';
import { PlanEditorTopMenu } from './PlanEditorTopMenu';
import { usePlanEditorActions } from './PlanEditorActions';
import { BlockConfigurationPanel } from './panels/block-configuration/BlockConfigurationPanel';
import { ConfigureItemInfo, DataEntityType, EditItemInfo, InspectItemInfo, InstanceInfo } from './types';
import { EditorPanels } from './panels/editor/EditorPanels';
import { InspectorPanels } from './panels/InspectorPanels';
import './PlanEditor.less';
import { getInstanceConfigs } from '../../api/LocalConfigService';
import { toClass } from '@kapeta/ui-web-utils';
import { useKapetaContext } from '../../hooks/contextHook';
import { BlockCreatorPanel } from './panels/BlockCreatorPanel';
import { BlockDefinition } from '@kapeta/schemas';
import { BlockTypeProvider } from '@kapeta/ui-web-context';
import { Box, Badge, Tab, Tabs, styled, Stack, Button, Slide } from '@mui/material';
import { PlannerGatewaysList } from './panels/GatewaysList';
import { getStatusDotForGroup } from '../../utils/statusDot';
import { DesktopReferenceResolutionHandler } from '../general/DesktopReferenceResolutionHandler';
import { useEffect } from 'react';
import { usePlanUpdater } from '../../hooks/updaterHooks';
import { PlanUpdaterModal } from './updater/PlanUpdaterModal';
import UpdateIconPending from '../../../../assets/images/update-icon-pending.svg';
import { AppSettingsContext } from '../../utils/AppSettingsContextSync';
import { BlockImporter, BlockImportResult } from '../asset-importers/BlockImporter';
import { useFileImporter } from '../../utils/useAssetImporter';
import { useBlockImporter } from '../asset-importers/hooks';

interface Props {
    systemId: string;
    resourceAssets: IResourceTypeProvider[];
    instanceInfos?: InstanceInfo[];
    ref: ForwardedRef<HTMLDivElement>;
}
export const StyledTab = styled(Tab, {
    name: 'Tab',
    slot: 'root',
})({
    textTransform: 'none',
    color: '#000',
    flexGrow: 1,
    maxWidth: '50%',
    '&.MuiTab-root': {
        paddingLeft: '24px',
        paddingRight: '24px',
    },
    '&.Mui-selected': {
        color: 'inherit',
    },
});

const useAssetInvalidationKey = (blocks: any[], resources: any[]) => {
    const [assetKey, setAssetKey] = useState(0);
    useEffect(() => setAssetKey((key) => key + 1), [blocks, resources]);
    return assetKey;
};

export const PlanEditor = withPlannerContext(
    forwardRef((props: Props, ref: ForwardedRef<HTMLDivElement>) => {
        const uri = parseKapetaUri(props.systemId);
        const planner = useContext(PlannerContext);
        const kapetaContext = useKapetaContext();
        const assetInvalidationKey = useAssetInvalidationKey(planner.blockAssets, props.resourceAssets);

        const [blockImport, setBlockImport] = useState<BlockImportResult | null>(null);
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
        }, [configFromInstances.value, configFromInstances.loading, planner.plan, planner.blockAssets]);

        const readonly = planner.mode !== PlannerMode.EDIT;

        const containerClass = toClass({
            'plan-editor': true,
        });

        const creatingNewBlock = !!(editInfo?.creating && editInfo.type === DataEntityType.BLOCK);

        const inspectInstanceInfo =
            (props.instanceInfos &&
                inspectInfo &&
                inspectInfo.type === DataEntityType.INSTANCE &&
                props.instanceInfos?.find((instance) => instance.instanceId === inspectInfo.item.instance.id)) ||
            undefined;

        const [currentTab, setCurrentTab] = useState(readonly ? 'urls' : 'assets');
        const statusDot = getStatusDotForGroup(Object.values(planner.instanceStates || {}));
        const planUpdater = usePlanUpdater();
        const missingReferences = usePlanValidation(planner.plan, planner.blockAssets);
        const appSettings = useContext(AppSettingsContext);
        const importBlock = useBlockImporter();

        if (missingReferences.length > 0) {
            return (
                <Box
                    ref={ref}
                    sx={{
                        p: 4,
                    }}
                >
                    <DesktopReferenceResolutionHandler
                        inline={true}
                        plan={planner.plan!}
                        planPath={planner.asset?.path}
                        planRef={props.systemId}
                        blockAssets={planner.blockAssets}
                        missingReferences={missingReferences}
                    />
                </Box>
            );
        }

        return (
            <div className={containerClass} ref={ref} data-kap-id={'plan-editor'}>
                <PlanEditorTopMenu readonly={readonly} version={uri.version} systemId={props.systemId} />

                <PlanUpdaterModal planUpdater={planUpdater} />

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
                    instanceInfo={inspectInstanceInfo}
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

                <BlockImporter
                    open={Boolean(blockImport)}
                    onImported={(asset) => {
                        // Make sure the block is added to the plan
                        planner.addBlockDefinition({
                            ref: asset.ref,
                            content: asset.data,
                            version: asset.version,
                            exists: true,
                            editable: true,
                        });

                        // Add the block instance to the plan
                        planner.addBlockInstance({
                            name: asset.data.metadata.title ?? parseKapetaUri(asset.ref).name,
                            id: randomUUID(),
                            block: {
                                ref: asset.ref,
                            },
                            dimensions: {
                                top: 50,
                                left: 50,
                                width: 0,
                                height: 0,
                            },
                        });
                    }}
                    onClose={() => setBlockImport(null)}
                    file={blockImport}
                />

                <PlannerDrawer>
                    <Tabs
                        value={currentTab}
                        onChange={(_evt, value) => setCurrentTab(value)}
                        sx={{
                            mt: '-16px',
                            position: 'sticky',
                            top: '-16px',
                            backgroundColor: 'background.default',
                            zIndex: 10,
                            borderBottom: '1px solid #0000001f',
                            '& .MuiTabs-indicator': {
                                // test
                                backgroundColor: 'tertiary.main',
                            },
                            display: 'flex',
                            justifyContent: 'stretch',
                        }}
                    >
                        {!readonly ? <StyledTab data-kap-id="assets-tab" value={'assets'} label="Assets" /> : null}
                        <StyledTab
                            data-kap-id="plan-editor-urls-tab"
                            value={'urls'}
                            label={
                                <Badge
                                    variant="dot"
                                    sx={{ '& .MuiBadge-badge': statusDot.styles || {} }}
                                    title={statusDot.title}
                                >
                                    <Box sx={{ px: 2 }}>URLs</Box>
                                </Badge>
                            }
                        />
                    </Tabs>
                    {currentTab === 'assets' && (
                        <Stack>
                            {planUpdater.updates.length > 0 && (
                                <Slide direction={'down'} in={true}>
                                    <Box
                                        sx={{
                                            pt: 1,
                                        }}
                                        textAlign={'center'}
                                    >
                                        <Button
                                            size={'small'}
                                            sx={{
                                                fontSize: '12px',
                                                fontWeight: 400,
                                                width: '100%',
                                                textDecoration: 'underline',
                                            }}
                                            endIcon={<UpdateIconPending height={18} />}
                                            color={'inherit'}
                                            onClick={() => {
                                                planUpdater.showReview();
                                            }}
                                        >
                                            {planUpdater.updates.length === 1 && `1 update available`}
                                            {planUpdater.updates.length > 1 &&
                                                `${planUpdater.updates.length} updates available`}
                                        </Button>
                                    </Box>
                                </Slide>
                            )}
                            <PlannerResourcesList
                                // Invalidate the resource list on local assets change
                                key={assetInvalidationKey}
                                onBlockImport={async () => {
                                    try {
                                        const fileImport = await importBlock();
                                        if (fileImport) {
                                            setBlockImport(fileImport);
                                        }
                                    } catch (e) {
                                        // Ignore
                                    }
                                }}
                                onShowMoreAssets={() => {
                                    kapetaContext.blockHub.open(planner.asset!, (selection) => {
                                        selection.forEach((asset, i) => {
                                            const ref = normalizeKapetaUri(
                                                `${asset.content.metadata.name}:${asset.version}`
                                            );
                                            planner.addBlockInstance({
                                                name: asset.content.metadata.title ?? parseKapetaUri(ref).name,
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
                                    });
                                }}
                            />
                        </Stack>
                    )}
                    {currentTab === 'urls' && (
                        <PlannerGatewaysList
                            systemId={props.systemId}
                            onConfigure={(info) => setConfigInfo({ type: DataEntityType.INSTANCE, item: info })}
                            readOnly={readonly}
                        />
                    )}
                </PlannerDrawer>

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
                    showPixelGrid={appSettings.show_pixel_grid}
                    initialZoomPanView={{
                        autoFit: true,
                        transitionDuration: 0,
                    }}
                />
            </div>
        );
    })
);
