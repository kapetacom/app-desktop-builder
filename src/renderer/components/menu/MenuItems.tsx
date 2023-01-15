import React from 'react';
import { MenuItem } from "./MenuDataModel";
import './Menu.less';
import { toClass, createHexagonPath, Orientation } from '@blockware/ui-web-utils';

import {SVGText} from '@blockware/ui-web-components';

interface MenuWrapperProps {
    menuItems: MenuItem[]
    visible?: boolean
    color?: string
    closeMenu:()=>void
}

const MenuItems = (props: MenuWrapperProps) => {
    const classnames = toClass({
        "menu-item-holder": true,
        "active-menu-item": !!props.visible
    })
    
    return (
        <svg width="350" height="400" className={classnames} x={40} y={-20} >
            {
                props.menuItems.map((menuItem: MenuItem, index: number) => {                                        
                    return (
                        <g x="0"
                            y="0"
                            onClick={() => {
                                menuItem.callback();
                                props.closeMenu();
                            }}
                            className={"menu-item"}
                            key={"menuItem" + index}
                            style={{ transform: `translateY(${-42 * index}px)` }}
                        >
                            <path d={createHexagonPath(180, 38, 3, Orientation.HORIZONTAL, 12)} ></path>
                            <SVGText className={"menu-item-text"} maxWidth={140} x={75} y={24} value={menuItem.text} />
                        </g>
                    )
                })
            }
        </svg>
    );

};


export default MenuItems;