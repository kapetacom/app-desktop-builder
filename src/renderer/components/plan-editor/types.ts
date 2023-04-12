import { Asset, ItemType, IResourceTypeProvider } from '@kapeta/ui-web-types';

import {
    BlockDefinition,
    BlockInstance,
    Connection,
    Resource,
} from '@kapeta/schemas';

import { PlannerContextData } from '@kapeta/ui-web-plan-editor';

export interface DraggableResourceProps {
    name: string;
    resourceConfig: IResourceTypeProvider;
    planner: PlannerContextData;
}

export interface DraggableBlockProps {
    name: string;
    title?: string;
    block: Asset<BlockDefinition>;
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
    instance: BlockInstance;
    block: BlockDefinition;
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
        resource: Resource;
        block: BlockDefinition;
    };
    creating: boolean;
}
export interface EditConnectionInfo {
    type: ItemType.CONNECTION;
    item: Connection;
    creating: boolean;
}

export type EditItemInfo =
    | EditBlockInfo
    | EditResourceInfo
    | EditConnectionInfo;

export interface InspectBlockInfo {
    type: ItemType.BLOCK;
    item: BlockInfo | Connection;
}

export interface InspectConnectionInfo {
    type: ItemType.CONNECTION;
    item: Connection;
}

export type InspectItemInfo = InspectBlockInfo | InspectConnectionInfo;

export interface ConfigureItemInfo {
    type: ItemType.BLOCK;
    item: BlockInfo;
}

export interface ActionHandlers {
    inspect: (info: InspectItemInfo) => void;
    configure: (info: ConfigureItemInfo) => void;
    edit: (info: EditItemInfo) => void;
}
