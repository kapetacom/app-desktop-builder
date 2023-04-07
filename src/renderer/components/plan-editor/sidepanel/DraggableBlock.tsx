import {DraggableBlockProps} from "../types";
import {Point} from "@kapeta/ui-web-types";
import {BlockNode} from "@kapeta/ui-web-plan-editor/dist/src";
import {InstanceStatus} from "@kapeta/ui-web-context";

const BLOCK_SIZE = 150;

export const DraggableBlock = (props: DraggableBlockProps & { point: Point }) => {
    const center = BLOCK_SIZE / 2;

    return (
        <svg
            className="plan-item-dragged block"
            style={{
                position: 'absolute',
                zIndex: 100,
                left: props.point.x - center,
                top: props.point.y - center,
                width: BLOCK_SIZE,
                height: BLOCK_SIZE,
                transformOrigin: `center`,
                transform: `scale(${props.planner.zoom})`,
            }}
        >
            <BlockNode
                name={props.name}
                valid
                instanceName={props.title ?? props.name}
                version={props.block.version}
                typeName={props.name}
                readOnly
                status={InstanceStatus.STOPPED}
                height={BLOCK_SIZE}
                width={BLOCK_SIZE}
            />
        </svg>
    );
};
