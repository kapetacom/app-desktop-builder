import {
    Asset,
    BlockConnectionSpec,
    BlockInstanceSpec,
    BlockKind,
    ItemType,
    ResourceConfig,
    ResourceKind,
    ResourceRole
} from "@kapeta/ui-web-types";
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

export interface BlockInfo {
    instance: BlockInstanceSpec;
    block: BlockKind;
}

export interface EditBlockInfo {
    type: ItemType.BLOCK;
    item: BlockInfo;
    creating: boolean;
}

export interface EditResourceInfo {
    type: ItemType.RESOURCE;
    item: {
        ref: string;
        resource: ResourceKind;
        block: BlockKind;
    };
    creating: boolean;
}
export interface EditConnectionInfo {
    type: ItemType.CONNECTION;
    item: BlockConnectionSpec;
    creating: boolean;
}

export type EditItemInfo = EditBlockInfo | EditResourceInfo | EditConnectionInfo;

export interface InspectBlockInfo {
    type: ItemType.BLOCK;
    item: BlockInfo|BlockConnectionSpec;
}

export interface InspectConnectionInfo {
    type: ItemType.CONNECTION;
    item: BlockConnectionSpec;
}

export type InspectItemInfo = InspectBlockInfo | InspectConnectionInfo;

export interface ConfigureItemInfo {
    type: ItemType.BLOCK;
    item: BlockInfo;
}

export interface ActionHandlers {
    inspect:(info: InspectItemInfo) => void;
    configure: (info: ConfigureItemInfo) => void;
    edit: (info: EditItemInfo) => void;
}
