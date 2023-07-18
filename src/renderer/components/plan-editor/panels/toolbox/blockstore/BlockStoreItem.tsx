import React, { useContext, useMemo } from 'react';
import { Asset, ItemType, Point } from '@kapeta/ui-web-types';
import { toClass } from '@kapeta/ui-web-utils';
import { BlockDefinition } from '@kapeta/schemas';

import { DnDDraggable, PlannerContext } from '@kapeta/ui-web-plan-editor';

import './BlockStoreItem.less';
import { DraggableItem } from '../../../types';

interface BlockStoreItemProps {
    item: Asset<BlockDefinition>;
    onItemDragStart?: (item: DraggableItem) => void;
    onItemDragEnd?: (item: DraggableItem) => void;
    onItemDrag?: (item: DraggableItem, point: Point) => void;
}

export const BlockStoreItem = (props: BlockStoreItemProps) => {
    const planner = useContext(PlannerContext);
    const blockStoreItem = toClass({
        'block-store-item': true,
        service: true,
    });

    let [handle, title] = props.item.data.metadata.name.split('/');
    if (props.item.data.metadata.title) {
        title = props.item.data.metadata.title;
    }

    const draggable: DraggableItem = useMemo(() => {
        return {
            type: ItemType.BLOCK,
            data: {
                block: props.item,
                name: props.item.data.metadata.name,
                planner,
                title,
            },
        };
    }, [props.item, planner, title]);

    return (
        <DnDDraggable
            onDragStart={() => {
                props.onItemDragStart?.(draggable);
            }}
            onDrag={(evt) => {
                props.onItemDrag?.(draggable, evt.zone.end);
            }}
            onDrop={() => {
                props.onItemDragEnd?.(draggable);
            }}
            data={{
                type: 'block-type',
                data: props.item,
            }}
        >
            {(draggableProps) => (
                <div
                    {...draggableProps.componentProps}
                    className={blockStoreItem}
                >
                    <div className="store-item ">
                        <p className="store-item-title">
                            <span className="name">{title}</span>
                            <span className="handle">{handle}</span>
                        </p>
                        <p className="store-item-version">
                            {props.item.version}
                        </p>
                        <div className="store-item-icon">
                            <img
                                alt={props.item.kind}
                                width="16px"
                                src="https://cdn4.iconfinder.com/data/icons/scripting-and-programming-languages/512/Python_logo-512.png"
                            />{' '}
                        </div>
                    </div>
                </div>
            )}
        </DnDDraggable>
    );
};
