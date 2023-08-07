import React, { useContext, useMemo, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import {
    Asset,
    IResourceTypeProvider,
    Point,
    ResourceRole,
} from '@kapeta/ui-web-types';
import {
    DnDDraggable,
    PlannerContext,
    PlannerPayload,
    PlannerPayloadType,
} from '@kapeta/ui-web-plan-editor';
import { BlockDefinition } from '@kapeta/schemas';
import { BlockStore } from './blockstore/BlockStore';
import { BlockResourceTool } from './BlockResourceTool';
import { ConsumerHeaderIcon, ProviderHeaderIcon } from '../../helpers';
import { DataEntityType, DraggableItem } from '../../types';
import { DraggableResource } from './DraggableResource';
import { DraggableBlock } from './DraggableBlock';

import './PlannerToolboxSidePanel.less';

const toPlannerPayload = (config: IResourceTypeProvider): PlannerPayload => {
    return {
        type: PlannerPayloadType.RESOURCE_TYPE,
        data: {
            title: config.title || config.kind,
            kind: config.kind,
            config,
        },
    };
};

interface Props {
    open: boolean;
    resourceAssets: IResourceTypeProvider[];
    onBlockAdded?: (asset: Asset<BlockDefinition>) => void;
}

export const PlanEditorToolBoxPanel = (props: Props) => {
    const planner = useContext(PlannerContext);
    const [draggableItem, setDraggableItem] = useState<DraggableItem | null>(
        null
    );
    const [draggableItemPosition, setDraggableItemPosition] =
        useState<Point | null>(null);

    const { resourceAssets } = props;
    const [providers, consumers] = useMemo(() => {
        if (!resourceAssets) {
            return [[], []];
        }

        const providerList = resourceAssets.filter(
            (item) => item.role === ResourceRole.PROVIDES
        );
        const consumerList = resourceAssets.filter(
            (item) => item.role === ResourceRole.CONSUMES
        );

        return [providerList, consumerList];
    }, [resourceAssets]);

    const toDraggableItem = (
        resourceConfig: IResourceTypeProvider
    ): DraggableItem => {
        return {
            type: DataEntityType.RESOURCE,
            data: {
                resourceConfig,
                planner,
                name: resourceConfig.title ?? resourceConfig.kind,
            },
        };
    };

    const handlers = {
        onItemDragEnd: () => setDraggableItem(null),
        onItemDragStart: setDraggableItem,
        onItemDrag: (item, point) => {
            setDraggableItemPosition(point);
        },
    };

    return (
        <>
            {draggableItem &&
                draggableItemPosition &&
                draggableItem.type === DataEntityType.RESOURCE && (
                    <DraggableResource
                        {...draggableItem.data}
                        point={draggableItemPosition}
                    />
                )}

            {draggableItem &&
                draggableItemPosition &&
                draggableItem.type === DataEntityType.INSTANCE && (
                    <DraggableBlock
                        {...draggableItem.data}
                        point={draggableItemPosition}
                    />
                )}

            <div
                className="plan-editor-toolbox-container"
                style={{ display: props.open ? 'block' : 'none' }}
            >
                <Tabs
                    className="toolbox-tabs"
                    defaultIndex={0}
                    forceRenderTabPanel
                >
                    <TabList>
                        <Tab>Resources</Tab>
                        <Tab>Blocks</Tab>
                    </TabList>
                    <TabPanel>
                        <div className="consumer-resources-title resource-section">
                            <div className="consumer-resources resources-section-title-line">
                                <div style={{ flex: 0.2 }}>
                                    <ConsumerHeaderIcon />
                                </div>
                                <div className="resources-section-title">
                                    <p>Consumers</p>
                                </div>
                            </div>
                            <div className="resource-listing">
                                {consumers.map((consumer) => {
                                    const data = toPlannerPayload(consumer);
                                    const draggable = toDraggableItem(consumer);

                                    return (
                                        <DnDDraggable
                                            key={
                                                consumer.definition.metadata
                                                    .name
                                            }
                                            data={data}
                                            onDragStart={(evt) => {
                                                handlers.onItemDragStart(
                                                    draggable
                                                );
                                            }}
                                            onDrag={(evt) => {
                                                handlers.onItemDrag(
                                                    draggable,
                                                    evt.zone.end
                                                );
                                            }}
                                            onDrop={(evt) => {
                                                handlers.onItemDragEnd();
                                            }}
                                        >
                                            {(dragProps) => (
                                                <BlockResourceTool
                                                    onMouseDown={
                                                        dragProps.componentProps
                                                            .onMouseDown
                                                    }
                                                    resource={consumer}
                                                />
                                            )}
                                        </DnDDraggable>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="provider-resources-title resource-section">
                            <div className="provider-resources resources-section-title-line">
                                <div style={{ flex: 0.2 }}>
                                    <ProviderHeaderIcon />
                                </div>
                                <div className="resources-section-title">
                                    <p>Providers</p>
                                </div>
                            </div>
                            <div className="resource-listing">
                                {providers.map((provider) => {
                                    const data = toPlannerPayload(provider);
                                    const draggable = toDraggableItem(provider);

                                    return (
                                        <DnDDraggable
                                            data={data}
                                            key={
                                                provider.definition.metadata
                                                    .name
                                            }
                                            onDragStart={(evt) => {
                                                handlers.onItemDragStart(
                                                    draggable
                                                );
                                            }}
                                            onDrag={(evt) => {
                                                handlers.onItemDrag(
                                                    draggable,
                                                    evt.zone.end
                                                );
                                            }}
                                            onDrop={(evt) => {
                                                handlers.onItemDragEnd();
                                            }}
                                        >
                                            {(dragProps) => (
                                                <BlockResourceTool
                                                    onMouseDown={
                                                        dragProps.componentProps
                                                            .onMouseDown
                                                    }
                                                    resource={provider}
                                                />
                                            )}
                                        </DnDDraggable>
                                    );
                                })}
                            </div>
                        </div>
                    </TabPanel>
                    <TabPanel>
                        <BlockStore {...handlers} />
                    </TabPanel>
                </Tabs>
            </div>
        </>
    );
};
