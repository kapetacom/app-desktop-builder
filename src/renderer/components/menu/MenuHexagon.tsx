import React from 'react';
import './Menu.less';

import {
    createSimpleHexagon,
    Orientation,
    toClass,
} from '@blockware/ui-web-utils';

interface MenuWrapperProps {
    size?: number;
    orientation?: Orientation;
    custom?: boolean;
    isDark?: boolean;
    children: any;
    onClick?: () => void;
    onTransitionEnd?: (evt: any) => void;
}

const MenuHexagon = (props: MenuWrapperProps) => {
    const getSize = () => {
        if (props.size) {
            return props.size;
        } else {
            return 30;
        }
    };

    const isDark = () => {
        return !!props.isDark;
    };

    return (
        <svg
            onTransitionEnd={(evt) => {
                if (props.onTransitionEnd) {
                    props.onTransitionEnd(evt);
                }
            }}
            onClick={props.onClick}
            className={'menu-hexagon ' + toClass({ dark: isDark() })}
        >
            <path
                d={createSimpleHexagon(1.3 * getSize(), Orientation.HORIZONTAL)}
            />
            {props.custom && props.children}
            {!props.custom && (
                <foreignObject
                    height="34"
                    x="16"
                    y="10"
                    width="30"
                    alignmentBaseline={'central'}
                >
                    {props.children}
                </foreignObject>
            )}
        </svg>
    );
};

export default MenuHexagon;
