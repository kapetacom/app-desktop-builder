import {parseKapetaUri} from '@kapeta/nodejs-utils';
import {Planner2, PlannerContext, PlannerMode, withPlannerContext} from "@kapeta/ui-web-plan-editor";
import {PlanEditorTopMenu} from "./PlanEditorTopMenu";
import React, {ForwardedRef, forwardRef, useContext, useMemo, useState} from "react";
import {withPlanEditorActions} from "./PlanEditorActions";
import {PlanEditorToolBoxPanel} from "./panels/toolbox/PlanEditorToolBoxPanel";
import {ResourceTypeProvider} from "@kapeta/ui-web-context";
import {BlockConfigurationPanel} from "./panels/block-configuration/BlockConfigurationPanel";
import {ConfigureItemInfo, EditItemInfo, InspectItemInfo} from "./types";
import {EditorPanels} from "./panels/editor/EditorPanels";
import {InspectorPanels} from "./panels/InspectorPanels";
import './PlanEditor.less'

interface Props {
    systemId: string
    ref: ForwardedRef<HTMLDivElement>
}

export const PlanEditor = withPlannerContext(forwardRef((props: Props, ref: ForwardedRef<HTMLDivElement>) => {
    const uri = parseKapetaUri(props.systemId);
    const planner = useContext(PlannerContext);

    const [configInfo, setConfigInfo] = useState<ConfigureItemInfo | null>(null);
    const [inspectInfo, setInspectInfo] = useState<InspectItemInfo | null>(null);
    const [editInfo, setEditInfo] = useState<EditItemInfo | null>(null);

    const actions = withPlanEditorActions(planner, {
        inspect: (info) => {
            setInspectInfo(info);
        },
        configure: (info) => {
            setConfigInfo(info);
        },
        edit: (info) => {
            setEditInfo(info);
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
                instance={configInfo?.item.instance ?? null}
                open={!!configInfo}
                onClosed={() => setConfigInfo(null)}
            />

            <InspectorPanels
                systemId={props.systemId}
                info={inspectInfo}
                onClosed={() => {
                    setInspectInfo(null);
                }}
            />

            <EditorPanels info={editInfo}
                          open={!!editInfo}
                          onClosed={() => setEditInfo(null)} />

            <Planner2
                actions={actions}
                systemId={props.systemId}
            />
        </div>
    )
}));
