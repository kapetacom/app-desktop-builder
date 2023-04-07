import {parseKapetaUri} from '@kapeta/nodejs-utils';
import {Planner2, PlannerContext, PlannerMode, withPlannerContext} from "@kapeta/ui-web-plan-editor";
import {PlanEditorTopMenu} from "./PlanEditorTopMenu";
import React, {forwardRef, MutableRefObject, useContext, useMemo} from "react";
import {withPlanEditorActions} from "./PlanEditorActions";
import './PlanEditor.less'
import {PlannerToolBoxSidePanel} from "./sidepanel/PlannerToolBoxSidePanel";
import {ResourceTypeProvider} from "@kapeta/ui-web-context";

interface Props {
    systemId: string
}

export const PlanEditor = withPlannerContext(forwardRef((props:Props, ref:MutableRefObject<HTMLDivElement>) => {
    const uri = parseKapetaUri(props.systemId);
    const planner = useContext(PlannerContext);
    const actions = withPlanEditorActions(planner, {
        inspect: (block) => {
            console.log('inspect', block);
        },
        configure: (block) => {
            console.log('configure', block);
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

            <PlannerToolBoxSidePanel
                open={!readonly}
                resourceAssets={resourceTypes}
            />

            <Planner2
                actions={actions}
                systemId={props.systemId}
            />
        </div>
    )
}));
