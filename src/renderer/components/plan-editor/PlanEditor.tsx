import {parseKapetaUri} from '@kapeta/nodejs-utils';
import {Planner2, PlannerContext, PlannerMode, withPlannerContext} from "@kapeta/ui-web-plan-editor";
import {PlanEditorTopMenu} from "./PlanEditorTopMenu";
import React, {forwardRef, MutableRefObject, useContext, useMemo, useState} from "react";
import {withPlanEditorActions} from "./PlanEditorActions";
import './PlanEditor.less'
import {PlanEditorToolBoxPanel} from "./panels/toolbox/PlanEditorToolBoxPanel";
import {ResourceTypeProvider} from "@kapeta/ui-web-context";
import {BlockInspectorPanel} from "./panels/block-inspector/BlockInspectorPanel";
import {BlockConnectionSpec, ItemType} from "@kapeta/ui-web-types";
import {BlockConfigurationPanel} from "./panels/block-configuration/BlockConfigurationPanel";
import {BlockInfo, ConfigureItemInfo, EditItemInfo, InspectItemInfo} from "./types";
import {ConnectionInspectorPanel} from "./panels/connection-inspector/ConnectionInspectorPanel";
import {ItemEditorPanel} from "./panels/editor/ItemEditorPanel";

interface Props {
    systemId: string
}

export const PlanEditor = withPlannerContext(forwardRef((props:Props, ref:MutableRefObject<HTMLDivElement>) => {
    const uri = parseKapetaUri(props.systemId);
    const planner = useContext(PlannerContext);

    const [configInfo, setConfigInfo] = useState<ConfigureItemInfo | null>(null);
    const [inspectInfo, setInspectInfo] = useState<InspectItemInfo|null>(null);
    const [editInfo, setEditInfo] = useState<EditItemInfo|null>(null);

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
                instance={configInfo?.item.instance}
                open={!!configInfo}
                onSave={(data) => {
                    console.log('save', data);
                }}
                onClose={() => setConfigInfo(null)}
            />

            <BlockInspectorPanel
                systemId={props.systemId}
                info={inspectInfo?.type === ItemType.BLOCK ? inspectInfo?.item as BlockInfo : null}
                open={inspectInfo?.type === ItemType.BLOCK}
                onClosed={() => {
                    setInspectInfo(null);
                }}
            />

            <ConnectionInspectorPanel
                open={inspectInfo?.type === ItemType.CONNECTION}
                onClosed={() => {
                    setInspectInfo(null);
                }}
                connection={inspectInfo?.type === ItemType.CONNECTION ? inspectInfo?.item as BlockConnectionSpec : null}
            />

            <ItemEditorPanel info={editInfo}
                             open={!!editInfo}
                             onSubmit={(data) => {
                                 console.log('Save', data);
                             }}
                             onClosed={() => setEditInfo(null)} />

            <Planner2
                actions={actions}
                systemId={props.systemId}
            />
        </div>
    )
}));
