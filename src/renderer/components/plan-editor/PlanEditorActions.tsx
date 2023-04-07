import {PlannerActionConfig, PlannerContextData, PlannerMode} from "@kapeta/ui-web-plan-editor";
import {ButtonStyle, DialogControl} from "@kapeta/ui-web-components";
import {BlockKind, ItemType, ResourceRole} from "@kapeta/ui-web-types";
import {parseKapetaUri} from '@kapeta/nodejs-utils';
import {useMemo} from "react";

interface BlockInstanceInfo {
    type: ItemType;
    item: BlockKind;
    ref?: string;
    creating: boolean;
}

interface Handlers {
    inspect:(block: BlockKind) => void;
    configure: (block: BlockKind) => void;
    edit: (info: BlockInstanceInfo) => void;
}


export const withPlanEditorActions = (planner: PlannerContextData, handlers: Handlers):PlannerActionConfig => {

    return useMemo(() => {
        return {
            block: [
                {
                    enabled(): boolean {
                        return true; // planner.mode !== PlannerMode.VIEW;
                    },
                    onClick(context, { block }) {
                        handlers.inspect(block!);
                    },
                    buttonStyle: ButtonStyle.PRIMARY,
                    icon: 'fa fa-search',
                    label: 'Inspect',
                },
                {
                    enabled(context, { blockInstance }): boolean {
                        return (
                            planner.mode !== PlannerMode.VIEW &&
                            !!blockInstance &&
                            parseKapetaUri(blockInstance.block.ref).version === 'local'
                        );
                    },
                    onClick(context, { blockInstance }) {
                        DialogControl.delete(
                            `Delete Block Instance`,
                            `Are you sure you want to delete ${blockInstance?.name || 'this block'}?`,
                            (confirm) => {
                                if (confirm) {
                                    planner.removeBlockInstance(blockInstance!.id);
                                }
                            }
                        );
                    },
                    buttonStyle: ButtonStyle.DANGER,
                    icon: 'fa fa-trash',
                    label: 'Delete',
                },
                {
                    enabled(context, { blockInstance }): boolean {
                        return (
                            planner.mode !== PlannerMode.VIEW &&
                            !!blockInstance &&
                            parseKapetaUri(blockInstance.block.ref).version === 'local'
                        );
                    },
                    onClick(context, { blockInstance, block }) {
                        handlers.edit({
                            type: ItemType.BLOCK,
                            item: block!,
                            ref: blockInstance!.block.ref,
                            creating: false,
                        });
                    },
                    buttonStyle: ButtonStyle.SECONDARY,
                    icon: 'fa fa-pencil',
                    label: 'Edit',
                },
                {
                    enabled(context, { blockInstance }): boolean {
                        return context.mode === PlannerMode.CONFIGURATION;
                    },
                    onClick(context, { block }) {
                        handlers.configure(block!);
                    },
                    buttonStyle: ButtonStyle.DEFAULT,
                    icon: 'fa fa-tools',
                    label: 'Configure',
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
                    onClick(p, { resource }) {
                        handlers.edit({
                            type: ItemType.RESOURCE,
                            item: resource!,
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
                    onClick(context, { blockInstance, resource, resourceRole }) {
                        DialogControl.delete(
                            `Delete Resource`,
                            `Are you sure you want to delete ${resource?.metadata.name || 'this resource'}?`,
                            (confirm) => {
                                if (confirm) {
                                    context.removeResource(
                                        blockInstance!.block.ref,
                                        resource!.metadata.name,
                                        resourceRole!
                                    );
                                }
                            }
                        );
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
                    onClick(context, { connection }) {
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

                        DialogControl.delete(
                            `Delete Connection?`,
                            `from ${from?.metadata.name} to ${to?.metadata.name}?`,
                            (confirm) => {
                                if (confirm) {
                                    planner.removeConnection(connection!);
                                }
                            }
                        );
                    },
                    buttonStyle: ButtonStyle.DANGER,
                    icon: 'fa fa-trash',
                    label: 'Delete',
                },
            ],
        };

    }, [planner, handlers]);
}
