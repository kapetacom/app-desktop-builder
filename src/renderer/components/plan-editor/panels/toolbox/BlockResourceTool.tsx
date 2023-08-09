import {
    ResourceTagSide,
    SVGCornersHelper,
    toClass,
} from '@kapeta/ui-web-utils';
import {
    IResourceTypeProvider,
    ResourceProviderType,
    ResourceRole,
} from '@kapeta/ui-web-types';
import { MouseEventHandler } from 'react';

export const RESOURCE_TAG_WIDTH = 128;
export const RESOURCE_TAG_HEIGHT = 45;
const RESOURCE_TAG_RADIUS = 3;
const RESOURCE_TAG_ANGLE_PERCENT = 10;

const ucFirst = (str: string) => {
    return str.charAt(0) + str.toLowerCase().substring(1);
};

const getResourceTagClasses = (resource: IResourceTypeProvider) => {
    return toClass({
        'toolbox-resource-listing-item': true,
        operator: resource.type === ResourceProviderType.OPERATOR,
        internal: resource.type === ResourceProviderType.INTERNAL,
        extension: resource.type === ResourceProviderType.EXTENSION,
        'consumer-item': resource.role === ResourceRole.CONSUMES,
        'provide-item': resource.role === ResourceRole.PROVIDES,
    });
};

interface Props {
    resource: IResourceTypeProvider;
    onMouseDown?: MouseEventHandler<HTMLDivElement> | undefined;
}

export const BlockResourceTool = (props: Props) => {
    let textX = 10;
    if (props.resource.role === ResourceRole.CONSUMES) {
        textX = 16;
    }

    return (
        <div
            role="menuitem"
            tabIndex={-1}
            className={getResourceTagClasses(props.resource)}
            onMouseDown={props.onMouseDown}
        >
            <svg
                className="item"
                width={RESOURCE_TAG_WIDTH}
                height={RESOURCE_TAG_HEIGHT}
                viewBox={`0 0 ${RESOURCE_TAG_WIDTH} ${RESOURCE_TAG_HEIGHT}`}
            >
                <path
                    d={SVGCornersHelper.getResourceTag3_25(
                        RESOURCE_TAG_WIDTH,
                        RESOURCE_TAG_RADIUS,
                        props.resource.role === ResourceRole.PROVIDES
                            ? ResourceTagSide.RIGHT
                            : ResourceTagSide.LEFT,
                        RESOURCE_TAG_ANGLE_PERCENT
                    )}
                />
                <text
                    className="resource-title"
                    textAnchor="start"
                    x={textX}
                    y="18"
                >
                    {props.resource.title}
                </text>
                <text
                    className="resource-type"
                    textAnchor="start"
                    x={textX}
                    y="35"
                >
                    {ucFirst(props.resource.type ?? 'unknown')}
                </text>
            </svg>
        </div>
    );
};