import {Tab, TabList, TabPanel, Tabs} from "react-tabs";
import {PanelAlignment, PanelSize, SidePanel} from "@kapeta/ui-web-components";
import BlockStore from "../../blockstore/BlockStore";
import {Asset, BlockKind, ItemType, Point, ResourceConfig, ResourceRole} from "@kapeta/ui-web-types";
import React, {useContext, useMemo, useState} from "react";
import {DnDDraggable, PlannerContext, PlannerPayload} from "@kapeta/ui-web-plan-editor";
import {BlockResourceTool} from "./BlockResourceTool";
import {ConsumerHeaderIcon, ProviderHeaderIcon} from "../../helpers";
import {DraggableItem} from "../../types";
import {DraggableResource} from "./DraggableResource";
import {DraggableBlock} from "./DraggableBlock";

import './PlannerToolboxSidePanel.less';

const toPlannerPayload = (config: ResourceConfig): PlannerPayload => {
    return {
        type: "resource-type",
        data: {
            title: config.title || config.kind,
            kind: config.kind,
            config: config,
        },
    };
}


interface Props {
    open: boolean;
    resourceAssets: ResourceConfig[];
    onBlockAdded?: (asset: Asset<BlockKind>) => void;
}

export const PlanEditorToolBoxPanel = (props: Props) => {
    const planner = useContext(PlannerContext);
    const [draggableItem, setDraggableItem] = useState<DraggableItem | null>(null);
    const [draggableItemPosition, setDraggableItemPosition] = useState<Point | null>(null);

    const {resourceAssets} = props;
    const [providers, consumers] = useMemo(() => {
        if (!resourceAssets) {
            return [[], []];
        }

        const providerList = resourceAssets.filter((item) => item.role === ResourceRole.PROVIDES);
        const consumerList = resourceAssets.filter((item) => item.role === ResourceRole.CONSUMES)

        return [providerList, consumerList];
    }, [resourceAssets]);

    const toDraggableItem = (resourceConfig: ResourceConfig): DraggableItem => {
        return {
            type: ItemType.RESOURCE,
            data: {
                resourceConfig,
                planner,
                name: resourceConfig.title ?? resourceConfig.kind,
            }
        };
    }

    const handlers = {
        onItemDragEnd: () => setDraggableItem(null),
        onItemDragStart:setDraggableItem,
        onItemDrag: (item, point) => {
            setDraggableItemPosition(point);
        }
    }

    return (
        <>


            {draggableItem && draggableItemPosition && draggableItem.type === ItemType.RESOURCE && (
                <DraggableResource {...draggableItem.data} point={draggableItemPosition} />
            )}

            {draggableItem && draggableItemPosition && draggableItem.type === ItemType.BLOCK && (
                <DraggableBlock {...draggableItem.data} point={draggableItemPosition} />
            )}

            <SidePanel
                className="plan-editor-toolbox-container"
                size={PanelSize.small}
                closable={false}
                side={PanelAlignment.right}
                open={props.open}
                modal={false}>
                <Tabs className="toolbox-tabs" defaultIndex={0} forceRenderTabPanel>
                    <TabList>
                        <Tab>Resources</Tab>
                        <Tab>Blocks</Tab>
                    </TabList>
                    <TabPanel>
                        <div className="consumer-resources-title resource-section">
                            <div className="consumer-resources resources-section-title-line">
                                <div style={{flex: 0.2}}>
                                    <ConsumerHeaderIcon/>
                                </div>
                                <div className="resources-section-title">
                                    <p>Consumers</p>
                                </div>
                            </div>
                            <div className="resource-listing">
                                {consumers.map((consumer, index: number) => {
                                    const data = toPlannerPayload(consumer);
                                    const draggable = toDraggableItem(consumer);

                                    return (
                                        <DnDDraggable key={index}
                                                      data={data}
                                                      onDragStart={(evt) => {
                                                          handlers.onItemDragStart(draggable);
                                                      }}
                                                      onDrag={(evt) => {
                                                          handlers.onItemDrag(draggable, evt.zone.end);
                                                      }}
                                                      onDrop={(evt) => {
                                                          handlers.onItemDragEnd();
                                                      }}
                                        >
                                            {(props) => (
                                                <BlockResourceTool onMouseDown={props.componentProps.onMouseDown}
                                                                   resource={consumer}/>
                                            )}
                                        </DnDDraggable>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="provider-resources-title resource-section">
                            <div className="provider-resources resources-section-title-line">
                                <div style={{flex: 0.2}}>
                                    <ProviderHeaderIcon/>
                                </div>
                                <div className="resources-section-title">
                                    <p>Providers</p>
                                </div>
                            </div>
                            <div className="resource-listing">
                                {providers.map((provider, index: number) => {
                                    const data = toPlannerPayload(provider)
                                    const draggable = toDraggableItem(provider);

                                    return (
                                        <DnDDraggable data={data}
                                                      key={index}

                                                      onDragStart={(evt) => {
                                                          handlers.onItemDragStart(draggable);
                                                      }}
                                                      onDrag={(evt) => {
                                                          handlers.onItemDrag(draggable, evt.zone.end);
                                                      }}
                                                      onDrop={(evt) => {
                                                          handlers.onItemDragEnd();
                                                      }}
                                        >
                                            {(props) => (
                                                <BlockResourceTool onMouseDown={props.componentProps.onMouseDown}
                                                                   resource={provider}/>
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
            </SidePanel>
        </>
    )
}
