import {PlannerActionConfig, PlannerContextData, PlannerMode} from "@kapeta/ui-web-plan-editor";
import {ButtonStyle, showDelete} from "@kapeta/ui-web-components";
import {
    BlockConnectionSpec,
    BlockInstanceSpec,
    ItemType,
    ResourceRole
} from "@kapeta/ui-web-types";
import {parseKapetaUri} from '@kapeta/nodejs-utils';
import {useEffect, useMemo} from "react";
import {ActionHandlers} from "./types";


export const withPlanEditorActions = (planner: PlannerContextData, handlers: ActionHandlers): PlannerActionConfig => {

    useEffect(() => {
        const unsubscribers = [
            planner.onResourceAdded((ref, block, resource) => {
                handlers.edit({
                    type: ItemType.RESOURCE,
                    creating: true,
                    item: {
                        ref,
                        resource,
                        block,
                    }
                })
            }),
            planner.onBlockInstanceAdded((instance: BlockInstanceSpec) => {
                const block = planner.getBlockByRef(instance.block.ref);
                handlers.edit({
                    type: ItemType.BLOCK,
                    creating: true,
                    item: {
                        block: block!,
                        instance: instance
                    }
                })
            }),
            planner.onConnectionAdded((connection: BlockConnectionSpec) => {
                handlers.edit({
                    type: ItemType.CONNECTION,
                    creating: true,
                    item: connection
                })
            })
        ];

        return () => unsubscribers.forEach(unsubscribe => unsubscribe());
    }, [])


    return useMemo(() => {
        return {
            block: [
                {
                    enabled(): boolean {
                        return true; // planner.mode !== PlannerMode.VIEW;
                    },
                    onClick(context, {block, blockInstance}) {
                        handlers.inspect({
                            type: ItemType.BLOCK,
                            item: {
                                instance: blockInstance!,
                                block: block!,
                            }
                        });
                    },
                    buttonStyle: ButtonStyle.PRIMARY,
                    icon: 'fa fa-search',
                    label: 'Inspect',
                },
                {
                    enabled(context, {blockInstance}): boolean {
                        return (
                            planner.mode !== PlannerMode.VIEW &&
                            !!blockInstance &&
                            parseKapetaUri(blockInstance.block.ref).version === 'local'
                        );
                    },
                    async onClick(context, {blockInstance}) {
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
                    enabled(context, {blockInstance}): boolean {
                        return (
                            planner.mode !== PlannerMode.VIEW &&
                            !!blockInstance &&
                            parseKapetaUri(blockInstance.block.ref).version === 'local'
                        );
                    },
                    onClick(context, {blockInstance, block}) {
                        handlers.edit({
                            type: ItemType.BLOCK,
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
                        return context.mode === PlannerMode.CONFIGURATION ||
                            context.mode === PlannerMode.EDIT;
                    },
                    onClick(context, {blockInstance, block}) {
                        handlers.configure({
                            type: ItemType.BLOCK,
                            item: {
                                block: block!,
                                instance: blockInstance!,
                            }
                        });
                    },
                    buttonStyle: ButtonStyle.DEFAULT,
                    icon: 'fa fa-tools',
                    label: 'Configure',
                },
            ],
            resource: [
                {
                    enabled(context, {blockInstance}): boolean {
                        return (
                            planner.mode !== PlannerMode.VIEW &&
                            !!blockInstance &&
                            parseKapetaUri(blockInstance.block.ref).version === 'local'
                        );
                    },
                    onClick(p, {resource, block, blockInstance}) {
                        handlers.edit({
                            type: ItemType.RESOURCE,
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
                    enabled(context, {blockInstance}): boolean {
                        return (
                            planner.mode !== PlannerMode.VIEW &&
                            !!blockInstance &&
                            parseKapetaUri(blockInstance.block.ref).version === 'local'
                        );
                    },
                    async onClick(context, {blockInstance, resource, resourceRole}) {
                        const confirm = await showDelete(
                            `Delete Resource`,
                            `Are you sure you want to delete ${resource?.metadata.name || 'this resource'}?`
                        );
                        if (confirm) {
                            context.removeResource(
                                blockInstance!.block.ref,
                                resource!.metadata.name,
                                resourceRole!
                            );
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
                    async onClick(context, {connection}) {
                        const from = planner.getResourceByBlockIdAndName(
                            connection!.from.blockId,
                            connection!.from.resourceName,
                            ResourceRole.PROVIDES
                        );
                        const to = planner.getResourceByBlockIdAndName(
                            connection!.to.blockId,
                            connection!.to.resourceName,
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
                    enabled(context): boolean {
                        return planner.mode === PlannerMode.EDIT;
                    },
                    onClick(context, {connection}) {
                        if (connection) {
                            handlers.edit({
                                type: ItemType.CONNECTION,
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
                    enabled(context): boolean {
                        return planner.mode === PlannerMode.EDIT;
                    },
                    onClick(context, {connection}) {
                        if (connection) {
                            handlers.inspect({
                                type: ItemType.CONNECTION,
                                item: connection,
                            });
                        }
                    },
                    buttonStyle: ButtonStyle.PRIMARY,
                    icon: 'fa fa-search',
                    label: 'Inspect',
                },
            ],
        };

    }, [planner, handlers]);
}
