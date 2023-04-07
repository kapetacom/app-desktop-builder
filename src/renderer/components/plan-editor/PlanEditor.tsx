import {parseKapetaUri} from '@kapeta/nodejs-utils';
import {Planner2, PlannerContext, PlannerMode, withPlannerContext} from "@kapeta/ui-web-plan-editor";
import {PlanEditorTopMenu} from "./PlanEditorTopMenu";
import React, {forwardRef, MutableRefObject, useContext, useMemo, useState} from "react";
import {withPlanEditorActions} from "./PlanEditorActions";
import './PlanEditor.less'
import Point = Electron.Point;
import {DraggableItem} from "./types";
import {ItemType} from "@kapeta/ui-web-types";
import {DraggableBlock} from "./DraggableBlock";
import {DraggableResource} from "./DraggableResource";
import {PlannerToolBoxSidePanel} from "./sidepanel/PlannerToolBoxSidePanel";
import {ResourceTypeProvider} from "@kapeta/ui-web-context";

interface Props {
    systemId: string
}

export const PlanEditor = withPlannerContext(forwardRef((props:Props, ref:MutableRefObject<HTMLDivElement>) => {
    const uri = parseKapetaUri(props.systemId);
    const planner = useContext(PlannerContext);
    const [draggableItem, setDraggableItem] = useState<DraggableItem | null>(null);
    const [draggableItemPosition, setDraggableItemPosition] = useState<Point | null>(null);
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


            {draggableItem && draggableItemPosition && draggableItem.type === ItemType.RESOURCE && (
                <DraggableResource {...draggableItem.data} point={draggableItemPosition} />
            )}

            {draggableItem && draggableItemPosition && draggableItem.type === ItemType.BLOCK && (
                <DraggableBlock {...draggableItem.data} point={draggableItemPosition} />
            )}

            <PlannerToolBoxSidePanel
                open={!readonly}
                resourceAssets={resourceTypes}
                onItemDragEnd={() => setDraggableItem(null)}
                onItemDragStart={setDraggableItem}
                onItemDrag={(item, point) => {
                    setDraggableItemPosition(point);
                }}
            />

            <Planner2
                actions={actions}
                systemId={props.systemId}
            />
        </div>
    )
}));
