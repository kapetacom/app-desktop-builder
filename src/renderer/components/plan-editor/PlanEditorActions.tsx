import { PlannerActionConfig, PlannerContextData, PlannerMode } from '@kapeta/ui-web-plan-editor';
import { ButtonStyle, useConfirmDelete } from '@kapeta/ui-web-components';
import { IResourceTypeConverter, ResourceRole } from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { useEffect, useMemo } from 'react';
import { InstanceStatus, ResourceTypeProvider } from '@kapeta/ui-web-context';
import { Connection } from '@kapeta/schemas';
import { ActionHandlers, DataEntityType, InstanceInfo } from './types';
import { InstanceService } from '../../api/InstanceService';

function getConverter(planner: PlannerContextData, connection: Connection): IResourceTypeConverter | null {
    try {
        const providerResource = planner.getResourceByBlockIdAndName(
            connection.provider.blockId,
            connection.provider.resourceName,
            ResourceRole.PROVIDES
        );

        const consumerResource = planner.getResourceByBlockIdAndName(
            connection.consumer.blockId,
            connection.consumer.resourceName,
            ResourceRole.CONSUMES
        );
        if (!providerResource || !consumerResource) {
            return null;
        }
        return ResourceTypeProvider.getConverterFor(providerResource.kind, consumerResource.kind) ?? null;
    } catch (e) {
        console.warn('Failed to get converter for connection', e);
        return null;
    }
}

function hasMapping(planner: PlannerContextData, connection: Connection): boolean {
    if (!connection) {
        return false;
    }

    const converter = getConverter(planner, connection);

    return !!(converter && converter.mappingComponentType);
}

export const usePlanEditorActions = (
    planner: PlannerContextData,
    instanceInfos: InstanceInfo[],
    handlers: ActionHandlers
): PlannerActionConfig => {
    useEffect(() => {
        const unsubscribers = [
            planner.onResourceAdded((ref, block, resource) => {
                handlers.edit({
                    type: DataEntityType.RESOURCE,
                    creating: true,
                    item: {
                        ref,
                        resource,
                        block,
                    },
                });
            }),
            planner.onConnectionAdded((connection: Connection) => {
                if (!hasMapping(planner, connection)) {
                    return;
                }

                handlers.edit({
                    type: DataEntityType.CONNECTION,
                    creating: true,
                    item: connection,
                });
            }),
        ];

        return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    }, [planner, handlers]);

    const showDelete = useConfirmDelete();

    function isRunning(state?: InstanceStatus): boolean {
        switch (state) {
            case InstanceStatus.STARTING:
            case InstanceStatus.READY:
            case InstanceStatus.UNHEALTHY:
                return true;
        }
        return false;
    }

    return useMemo(() => {
        return {
            block: [
                {
                    enabled(): boolean {
                        return true; // planner.mode !== PlannerMode.VIEW;
                    },
                    onClick(context, { block, blockInstance }) {
                        handlers.inspect({
                            type: DataEntityType.INSTANCE,
                            item: {
                                instance: blockInstance!,
                                block: block!,
                            },
                        });
                    },
                    buttonStyle: ButtonStyle.PRIMARY,
                    icon: 'fa fa-search',
                    label: 'Inspect',
                    warningInspector: true,
                },
                {
                    enabled(context): boolean {
                        return context.mode === PlannerMode.EDIT && context.uri?.version === 'local';
                    },
                    async onClick(context, { blockInstance }) {
                        const confirm = await showDelete(
                            `Delete Block Instance`,
                            `Are you sure you want to delete ${blockInstance?.name || 'this block'}?`
                        );
                        if (confirm) {
                            planner.removeBlockInstance(blockInstance!.id);
                        }
                    },
                    buttonStyle: ButtonStyle.DANGER,
                    icon: 'fa fa-trash',
                    label: 'Delete',
                },
                {
                    enabled(context, { blockInstance }): boolean {
                        return (
                            planner.mode === PlannerMode.EDIT &&
                            !!blockInstance &&
                            parseKapetaUri(blockInstance.block.ref).version === 'local'
                        );
                    },
                    onClick(context, { blockInstance, block }) {
                        handlers.edit({
                            type: DataEntityType.INSTANCE,
                            item: {
                                block: block!,
                                instance: blockInstance!,
                            },
                            creating: false,
                        });
                    },
                    buttonStyle: ButtonStyle.SECONDARY,
                    icon: 'fa fa-pencil',
                    label: 'Edit',
                },
                {
                    enabled(context): boolean {
                        return context.mode === PlannerMode.CONFIGURATION || context.mode === PlannerMode.EDIT;
                    },
                    onClick(context, { blockInstance, block }) {
                        handlers.configure({
                            type: DataEntityType.INSTANCE,
                            item: {
                                block: block!,
                                instance: blockInstance!,
                            },
                        });
                    },
                    buttonStyle: ButtonStyle.DEFAULT,
                    icon: 'fa fa-tools',
                    label: 'Configure',
                },
                {
                    enabled(): boolean {
                        return true; // we can always stop/start an instance
                    },
                    async onClick(context, { blockInstance }) {
                        if (!context.uri?.id || !blockInstance?.id) {
                            return;
                        }
                        const info = instanceInfos.find((ix) => ix.instanceId === blockInstance?.id);
                        if (isRunning(info?.status)) {
                            await InstanceService.stopInstance(context.uri?.id, blockInstance.id);
                        } else {
                            await InstanceService.startInstance(context.uri?.id, blockInstance.id);
                        }
                    },
                    buttonStyle(context, { blockInstance }): ButtonStyle {
                        const info = instanceInfos.find((ix) => ix.instanceId === blockInstance?.id);
                        if (isRunning(info?.status)) {
                            return ButtonStyle.DANGER;
                        }
                        return ButtonStyle.PRIMARY;
                    },
                    icon(context, { blockInstance }): string {
                        const info = instanceInfos.find((ix) => ix.instanceId === blockInstance?.id);
                        if (isRunning(info?.status)) {
                            return 'fa fa-stop';
                        }
                        return 'fa fa-play';
                    },
                    label(context, { blockInstance }): string {
                        const info = instanceInfos.find((ix) => ix.instanceId === blockInstance?.id);
                        if (isRunning(info?.status)) {
                            return 'Stop';
                        }
                        return 'Start';
                    },
                },
                {
                    enabled(context, { blockInstance }): boolean {
                        const info = instanceInfos.find((ix) => ix.instanceId === blockInstance?.id);
                        if (!info?.address) {
                            return false;
                        }

                        return isRunning(info.status);
                    },
                    onClick(context, { blockInstance }) {
                        const info = instanceInfos.find((ix) => ix.instanceId === blockInstance?.id);
                        if (!info?.address) {
                            return;
                        }
                        window.open(info.address, blockInstance?.id);
                    },
                    buttonStyle: ButtonStyle.DEFAULT,
                    icon: 'fa fa-globe',
                    label: 'Visit',
                },
            ],
            resource: [
                {
                    enabled(context, { blockInstance }): boolean {
                        return (
                            planner.mode !== PlannerMode.VIEW &&
                            !!blockInstance &&
                            parseKapetaUri(blockInstance.block.ref).version === 'local'
                        );
                    },
                    onClick(p, { resource, block, blockInstance }) {
                        handlers.edit({
                            type: DataEntityType.RESOURCE,
                            item: {
                                resource: resource!,
                                block: block!,
                                ref: blockInstance!.block.ref,
                            },
                            creating: false,
                        });
                    },
                    buttonStyle: ButtonStyle.SECONDARY,
                    icon: 'fa fa-pencil',
                    label: 'Edit',
                },
                {
                    enabled(context, { blockInstance }): boolean {
                        return (
                            planner.mode !== PlannerMode.VIEW &&
                            !!blockInstance &&
                            parseKapetaUri(blockInstance.block.ref).version === 'local'
                        );
                    },
                    async onClick(context, { blockInstance, resource, resourceRole }) {
                        const confirm = await showDelete(
                            `Delete Resource`,
                            `Are you sure you want to delete ${resource?.metadata.name || 'this resource'}?`
                        );
                        if (confirm) {
                            context.removeResource(blockInstance!.block.ref, resource!.metadata.name, resourceRole!);
                        }
                    },
                    buttonStyle: ButtonStyle.DANGER,
                    icon: 'fa fa-trash',
                    label: 'Delete',
                },
            ],
            connection: [
                {
                    enabled(context): boolean {
                        return planner.mode === PlannerMode.EDIT;
                    },
                    async onClick(context, { connection }) {
                        const from = planner.getResourceByBlockIdAndName(
                            connection!.provider.blockId,
                            connection!.provider.resourceName,
                            ResourceRole.PROVIDES
                        );
                        const to = planner.getResourceByBlockIdAndName(
                            connection!.consumer.blockId,
                            connection!.consumer.resourceName,
                            ResourceRole.CONSUMES
                        );

                        const confirm = await showDelete(
                            `Delete Connection?`,
                            `${from?.metadata.name} to ${to?.metadata.name}?`
                        );

                        if (confirm) {
                            planner.removeConnection(connection!);
                        }
                    },
                    buttonStyle: ButtonStyle.DANGER,
                    icon: 'fa fa-trash',
                    label: 'Delete',
                },
                {
                    enabled(context, actionContext): boolean {
                        if (planner.mode !== PlannerMode.EDIT) {
                            return false;
                        }

                        const connection = actionContext.connection;
                        if (!connection) {
                            return false;
                        }

                        const converter = getConverter(planner, connection);

                        return !!(converter && converter.mappingComponentType);
                    },
                    onClick(context, { connection }) {
                        if (connection) {
                            handlers.edit({
                                type: DataEntityType.CONNECTION,
                                item: connection,
                                creating: false,
                            });
                        }
                    },
                    buttonStyle: ButtonStyle.SECONDARY,
                    icon: 'fa fa-pencil',
                    label: 'Edit mapping',
                },
                {
                    enabled(context, actionContext): boolean {
                        const connection = actionContext.connection;
                        if (!connection) {
                            return false;
                        }

                        const converter = getConverter(context, connection);

                        return !!(converter && converter.inspectComponentType);
                    },
                    onClick(context, { connection }) {
                        if (connection) {
                            handlers.inspect({
                                type: DataEntityType.CONNECTION,
                                item: connection,
                            });
                        }
                    },
                    buttonStyle: ButtonStyle.PRIMARY,
                    icon: 'fa fa-search',
                    label: 'Inspect',
                },
            ],
        } satisfies PlannerActionConfig;
    }, [planner, handlers, instanceInfos]);
};
