import {Asset, BlockKind, ItemType, ResourceConfig} from "@kapeta/ui-web-types";
import {PlannerContextData} from "@kapeta/ui-web-plan-editor";

export interface DraggableResourceProps {
    name: string;
    resourceConfig: ResourceConfig;
    planner: PlannerContextData;
}

export interface DraggableBlockProps {
    name: string;
    title?: string;
    block: Asset<BlockKind>;
    planner: PlannerContextData;
}

export interface DraggableResourceItem {
    type: ItemType.RESOURCE;
    data: DraggableResourceProps;
}

export interface DraggableBlockItem {
    type: ItemType.BLOCK;
    data: DraggableBlockProps;
}

export type DraggableItem = DraggableResourceItem | DraggableBlockItem;
