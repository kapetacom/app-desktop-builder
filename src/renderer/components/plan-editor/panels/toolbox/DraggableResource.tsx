import {DraggableResourceProps} from "../../types";
import {Point} from "@kapeta/ui-web-types";
import {BlockResourceTool, RESOURCE_TAG_HEIGHT, RESOURCE_TAG_WIDTH} from "./BlockResourceTool";

export const DraggableResource = (props: DraggableResourceProps & { point: Point }) => {
    return (
        <div className={'plan-item-dragged resource'}
             style={{
                 position: 'absolute',
                 zIndex: 100,
                 left: props.point.x - (RESOURCE_TAG_WIDTH/2),
                 top: props.point.y - (RESOURCE_TAG_HEIGHT/2),
                 width: RESOURCE_TAG_WIDTH,
                 height: RESOURCE_TAG_HEIGHT,
                 transformOrigin: `center`,
                 transform: `scale(${props.planner.zoom})`,
             }}>
            <BlockResourceTool resource={props.resourceConfig} />
        </div>
    );
};
