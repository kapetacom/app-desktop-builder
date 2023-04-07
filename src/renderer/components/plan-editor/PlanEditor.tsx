import {parseKapetaUri} from '@kapeta/nodejs-utils';
import {Planner2, PlannerContext, PlannerMode, withPlannerContext} from "@kapeta/ui-web-plan-editor";
import {PlanEditorTopMenu} from "./PlanEditorTopMenu";
import React, {forwardRef, MutableRefObject, useContext, useMemo, useState} from "react";
import {withPlanEditorActions} from "./PlanEditorActions";
import './PlanEditor.less'
import {PlanEditorToolBoxPanel} from "./panels/toolbox/PlanEditorToolBoxPanel";
import {ResourceTypeProvider} from "@kapeta/ui-web-context";
import {BlockInspectorPanel} from "./panels/block-inspector/BlockInspectorPanel";
import {BlockInstanceSpec, BlockKind} from "@kapeta/ui-web-types";
import {BlockConfigurationPanel} from "./panels/block-configuration/BlockConfigurationPanel";

interface Props {
    systemId: string
}

export const PlanEditor = withPlannerContext(forwardRef((props:Props, ref:MutableRefObject<HTMLDivElement>) => {
    const uri = parseKapetaUri(props.systemId);
    const planner = useContext(PlannerContext);

    const [configBlock, setConfigBlock] = useState<BlockInstanceSpec | null>(null);
    const [inspectBlock, setInspectBlock] = useState<BlockKind | null>(null);
    const [inspectInstance, setInspectInstance] = useState<BlockInstanceSpec | null>(null);

    const actions = withPlanEditorActions(planner, {
        inspect: (instance, block) => {
            setInspectInstance(instance);
            setInspectBlock(block);
        },
        configure: (instance) => {
            setConfigBlock(instance);
        },
        edit: (info) => {
            console.log('edit', info);
        }
    });

    const resourceTypes = useMemo(() => ResourceTypeProvider.list(), []);
    const readonly = planner.mode !== PlannerMode.EDIT;

    return (
        <div className={'plan-editor'} ref={ref}>
            <PlanEditorTopMenu
                readonly={readonly}
                version={uri.version}
                systemId={props.systemId}
            />

            <PlanEditorToolBoxPanel
                open={!readonly}
                resourceAssets={resourceTypes}
            />

            <BlockConfigurationPanel
                instance={configBlock}
                open={!!configBlock}
                onSave={(data) => {
                    console.log('save', data);
                }}
                onClose={() => setConfigBlock(null)}
            />

            <BlockInspectorPanel
                systemId={props.systemId}
                block={inspectBlock}
                instance={inspectInstance}
                open={!!(inspectBlock && inspectInstance)}
                onClosed={() => {
                    setInspectBlock(null);
                    setInspectInstance(null);
                }}
            />

            <Planner2
                actions={actions}
                systemId={props.systemId}
            />
        </div>
    )
}));
