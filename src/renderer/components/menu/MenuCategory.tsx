import React, { Component } from 'react';
import './Menu.less';
import MenuHexagon from './MenuHexagon';
import { CategoryState, MenuCategoryItem } from './MenuDataModel';
import { Orientation, toClass } from '@blockware/ui-web-utils';

import MenuItems from './MenuItems';

interface MenuCategoryProps {
    menuOpen:boolean
    size?: number
    open: boolean
    backgroundColor?: string
    orientation?: Orientation
    onChange: (open: boolean) => void
    icon: string
    activeIndex: number
    toggleNextCategory: (expand: boolean) => void
    categoryItem: MenuCategoryItem
    categoryIndex: number
    animationState: CategoryState
}
interface MenuCategoryState {
    yPosition: number
}

const MENU_ITEM_HEIGHT = 40;
export default class MenuCategory extends Component<MenuCategoryProps, MenuCategoryState>{

    constructor(props: MenuCategoryProps) {
        super(props);
        this.state = {
            yPosition: this.subMenuPosition()
        }
    }
    private subMenuPosition = () => {
        if (this.props.animationState === CategoryState.OPEN) {
            if (this.props.categoryIndex >= this.props.activeIndex) return -(MENU_ITEM_HEIGHT + MENU_ITEM_HEIGHT * this.props.activeIndex)
            if (this.props.categoryIndex < this.props.activeIndex) return -(MENU_ITEM_HEIGHT + MENU_ITEM_HEIGHT * this.props.categoryIndex)
        }
        return 0;
    }
    private currentPosition = () => {
        if (this.props.animationState === CategoryState.OPEN) {
            if (this.props.categoryIndex >= this.props.activeIndex) return -(MENU_ITEM_HEIGHT + MENU_ITEM_HEIGHT * this.props.activeIndex)
            if (this.props.categoryIndex < this.props.activeIndex) return -(MENU_ITEM_HEIGHT + MENU_ITEM_HEIGHT * this.props.categoryIndex)
        }
        if (this.props.animationState === CategoryState.CLOSED) {

            if (this.props.categoryIndex >= this.props.activeIndex) return -(MENU_ITEM_HEIGHT * this.props.activeIndex)
            if (this.props.categoryIndex < this.props.activeIndex) return -(MENU_ITEM_HEIGHT + MENU_ITEM_HEIGHT * this.props.categoryIndex)
        }
        return 0;
    }

    private toggleMenuItems = () => {
        this.props.onChange(this.props.open);
    }

    private handleTransitionEnd(activeIndex: number) {
        const isCurrentIndex = (this.props.categoryIndex === activeIndex);
        if (isCurrentIndex) {
            if (this.props.animationState === CategoryState.OPEN) {
                this.props.toggleNextCategory(true)
            } else if (this.props.animationState === CategoryState.CLOSED) {
                if (activeIndex - 1 >= 0) {
                    this.props.toggleNextCategory(false);
                }
            }
        }
    }

    render() {
        const isActive = this.props.activeIndex >= this.props.categoryIndex;
        const isCurrent = this.props.activeIndex === this.props.categoryIndex;

        const classnames = toClass({
            "active": this.props.open === true,
            "folding": isCurrent,
            "hidden": this.props.open === false
        })
        // console.log('rendering', this.props.categoryIndex, this.props.activeIndex, isCurrent, isActive);

        return (
            <>

                <g className={"menu-category " + classnames} onTransitionEndCapture={() => {
                    this.handleTransitionEnd(this.props.activeIndex)
                }}
                    style={{
                        opacity: isActive ? 1 : 0,
                        transform: `translateY(${this.currentPosition()}px)`
                    }}
                >
                    <g className={"menu-category-inner"}>

                        <MenuHexagon onClick={this.props.menuOpen?this.toggleMenuItems:()=>{} }>
                            <i className={`fal ${this.props.icon}`}></i>
                        </MenuHexagon>
                        < g
                            className={"sub-category-menu-item-holder active"}
                            style={{ pointerEvents: this.props.open ? "all" : "none" }}
                        >
                            <MenuItems closeMenu={() => { this.toggleMenuItems() }} visible={this.props.open} menuItems={this.props.categoryItem.menuItems} />
                        </g>
                    </g>
                </g>
            </>
        );

    }
};

