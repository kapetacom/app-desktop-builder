import { DraggableBlockProps } from '../../types';
import { Point } from '@kapeta/ui-web-types';
import { BlockNode } from '@kapeta/ui-web-plan-editor';
import { BlockTypeProvider, InstanceStatus } from '@kapeta/ui-web-context';

const BLOCK_SIZE = 150;

export const DraggableBlock = (
    props: DraggableBlockProps & { point: Point }
) => {
    const center = BLOCK_SIZE / 2;
    const blockType = BlockTypeProvider.get(props.block.data!.kind);
    const Shape = blockType?.shapeComponent || BlockNode;

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
            <Shape
                block={props.block.data}
                instance={{
                    id: 'temp-block',
                    name: props.name,
                    block: { ref: props.block.ref },
                    dimensions: { height: 0, width: 0, top: 0, left: 0 },
                }}
                valid
                readOnly
                status={InstanceStatus.STOPPED}
                height={BLOCK_SIZE}
                width={BLOCK_SIZE}
            />
        </svg>
    );
};
