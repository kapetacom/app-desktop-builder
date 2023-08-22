import { IResourceTypeProvider } from '@kapeta/ui-web-types';

import { BlockDefinition, BlockInstance, Connection, Resource } from '@kapeta/schemas';

import { AssetInfo, PlannerContextData } from '@kapeta/ui-web-plan-editor';
import { InstanceStatus } from '@kapeta/ui-web-context';

export interface InstanceInfo {
    systemId: string;
    instanceId: string;
    status: InstanceStatus;
    pid: string | number;
    type: 'local' | 'docker';
    health: string;
    address: string;
}

export interface DraggableResourceProps {
    name: string;
    resourceConfig: IResourceTypeProvider;
    planner: PlannerContextData;
}

export interface DraggableBlockProps {
    name: string;
    block: AssetInfo<BlockDefinition>;
    planner: PlannerContextData;
}

export interface DraggableResourceItem {
    type: DataEntityType.RESOURCE;
    data: DraggableResourceProps;
}

export interface DraggableBlockItem {
    type: DataEntityType.INSTANCE;
    data: DraggableBlockProps;
}

export type DraggableItem = DraggableResourceItem | DraggableBlockItem;

export interface BlockInfo {
    instance: BlockInstance;
    block: BlockDefinition;
}

export enum DataEntityType {
    BLOCK = 'BLOCK',
    INSTANCE = 'INSTANCE',
    RESOURCE = 'RESOURCE',
    CONNECTION = 'CONNECTION',
}

export interface EditInstanceInfo {
    type: DataEntityType.INSTANCE;
    item: BlockInfo;
    creating: boolean;
}

export interface CreateBlockInfo {
    type: DataEntityType.BLOCK;
    item: {
        instance: BlockInstance;
        asset: AssetInfo<BlockDefinition>;
    };
    creating: true;
}

export interface EditResourceInfo {
    type: DataEntityType.RESOURCE;
    item: {
        ref: string;
        resource: Resource;
        block: BlockDefinition;
    };
    creating: boolean;
}
export interface EditConnectionInfo {
    type: DataEntityType.CONNECTION;
    item: Connection;
    creating: boolean;
}

export type EditItemInfo = EditInstanceInfo | EditResourceInfo | EditConnectionInfo | CreateBlockInfo;

export interface InspectBlockInfo {
    type: DataEntityType.INSTANCE;
    item: BlockInfo | Connection;
}

export interface InspectConnectionInfo {
    type: DataEntityType.CONNECTION;
    item: Connection;
}

export type InspectItemInfo = InspectBlockInfo | InspectConnectionInfo;

export interface ConfigureItemInfo {
    type: DataEntityType.INSTANCE;
    item: BlockInfo;
}

export interface ActionHandlers {
    inspect: (info: InspectItemInfo) => void;
    configure: (info: ConfigureItemInfo) => void;
    edit: (info: EditItemInfo) => void;
}
