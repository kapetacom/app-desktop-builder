import React, { Component } from 'react';
import { toClass } from '@blockware/ui-web-utils';
import * as _ from 'lodash';

import { MenuCategoryItem, CategoryState } from './MenuDataModel';
import './Menu.less';
import MenuCategory from './MenuCategory';
import MenuHexagon from './MenuHexagon';

interface MenuWrapperProps {
    menuCategoryItems: MenuCategoryItem[];
    turn?: number;
}
interface MenuWrapperState {
    menuOpen: boolean;
    activeIndex: number;
    categoryItemState: CategoryState;
    menuCategoryItems: MenuCategoryItem[];
}

export default class Menu extends Component<
    MenuWrapperProps,
    MenuWrapperState
> {
    constructor(props: MenuWrapperProps) {
        super(props);
        this.state = {
            menuOpen: false,
            categoryItemState: CategoryState.CLOSED,
            activeIndex: 0,
            menuCategoryItems: this.props.menuCategoryItems,
        };
    }

    private toggleNextCategory = (expanding: boolean) => {
        if (
            expanding &&
            this.state.activeIndex < this.state.menuCategoryItems.length
        ) {
            this.setState({
                activeIndex: this.state.activeIndex + 1,
                categoryItemState: CategoryState.OPEN,
            });
        } else if (this.state.activeIndex > -1 && !expanding) {
            this.setState({
                activeIndex: this.state.activeIndex - 1,
                categoryItemState: CategoryState.CLOSED,
            });
        }

        return true;
    };

    private toggleMenuCategories = (open: boolean, index: number) => {
        this.resetCategoryMenus();
        const temCategoryItems = _.cloneDeep(this.state.menuCategoryItems);
        if (!open) {
            temCategoryItems[index].open = true;
        } else {
            temCategoryItems[index].open = false;
        }
        this.setState({ menuCategoryItems: temCategoryItems });
    };

    private toggleMenu = () => {
        if (!this.state.menuOpen) {
            this.setState({
                activeIndex: 0,
                categoryItemState: CategoryState.OPEN,
                menuOpen: true,
            });
        } else {
            this.setState({
                activeIndex: this.state.menuCategoryItems.length - 1,
                categoryItemState: CategoryState.CLOSED,
                menuOpen: false,
            });
        }

        return true;
    };

    private resetCategoryMenus = () => {
        let tempMenuCategories = this.state.menuCategoryItems;
        tempMenuCategories = this.state.menuCategoryItems.map(
            (categoryMenu) => {
                categoryMenu.open = false;
                return categoryMenu;
            }
        );
        this.setState({ menuCategoryItems: tempMenuCategories });
    };

    private renderMenuCategories() {
        const categoryItems = _.clone(this.state.menuCategoryItems);

        categoryItems.reverse();

        return (
            <>
                {categoryItems.map(
                    (categoryItem: MenuCategoryItem, reverseIndex: number) => {
                        const index =
                            this.state.menuCategoryItems.length -
                            reverseIndex -
                            1;
                        return (
                            <MenuCategory
                                menuOpen={this.state.menuOpen}
                                key={`${index}menuItem`}
                                activeIndex={this.state.activeIndex}
                                animationState={this.state.categoryItemState}
                                open={categoryItem.open}
                                categoryItem={categoryItem}
                                icon={categoryItem.icon}
                                toggleNextCategory={this.toggleNextCategory}
                                onChange={(open) => {
                                    this.toggleMenuCategories(open, index);
                                }}
                                categoryIndex={index}
                            />
                        );
                    }
                )}
            </>
        );
    }

    private calcRotationDeg() {
        const countSteps = this.props.menuCategoryItems.length;
        const slice = 360 / countSteps;
        return slice * this.state.activeIndex;
    }

    private toggleCategories = () => {
        let temCategoryItems = _.cloneDeep(this.state.menuCategoryItems);
        temCategoryItems = temCategoryItems.map((category) => {
            category.open = false;
            return category;
        });

        this.setState({ menuCategoryItems: temCategoryItems });
        this.resetCategoryMenus();
    };

    render() {
        const classNames = toClass({
            'menu-wrapper': true,
            'menu-open': this.state.menuOpen,
        });
        return (
            <svg className={classNames}>
                <g className="menu">
                    {this.renderMenuCategories()}
                    <MenuHexagon
                        isDark
                        custom
                        onClick={() => {
                            this.toggleCategories();
                            this.toggleMenu();
                        }}
                    >
                        <svg
                            x="-115"
                            y="7"
                            viewBox="0 0 130 130"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <g
                                className="menu-logo"
                                style={{
                                    transform: `rotate(${this.calcRotationDeg()}deg)`,
                                    transformOrigin: '26.5% 24.5%',
                                }}
                            >
                                <path
                                    d="M26.6901 30.519C28.7914 30.519 30.1048 28.2442 29.0541 26.4244L17.3572 6.16471C16.3065 4.34489 13.6798 4.34488 12.6291 6.1647L0.932187 26.4244C-0.118486 28.2442 1.19485 30.519 3.2962 30.519H26.6901Z "
                                    fill="#F19890"
                                />
                                <path
                                    d="M3.29533 32.481C1.19398 32.481 -0.119363 34.7558 0.93131 36.5756L12.6283 56.8353C13.6789 58.6551 16.3056 58.6551 17.3563 56.8353L29.0532 36.5756C30.1039 34.7558 28.7906 32.481 26.6892 32.481L3.29533 32.481Z"
                                    fill="#F19890"
                                />
                                <path
                                    d="M49.4019 4.2027C50.4525 2.38288 49.1392 0.108105 47.0379 0.108105L23.644 0.108107C21.5426 0.108107 20.2293 2.38288 21.2799 4.2027L32.9769 24.4624C34.0276 26.2822 36.6542 26.2822 37.7049 24.4624L49.4019 4.2027Z"
                                    fill="#FADEDD"
                                />
                                <path
                                    d="M39.4027 25.4434C38.352 27.2632 39.6654 29.538 41.7667 29.538L65.1606 29.538C67.262 29.538 68.5753 27.2632 67.5246 25.4434L55.8277 5.18368C54.777 3.36386 52.1503 3.36386 51.0997 5.18368L39.4027 25.4434Z"
                                    fill="#FADEDD"
                                />
                                <path
                                    d="M51.0722 57.8163C52.1229 59.6362 54.7496 59.6362 55.8003 57.8163L67.4972 37.5566C68.5479 35.7368 67.2345 33.462 65.1332 33.462L41.7393 33.462C39.6379 33.462 38.3246 35.7368 39.3753 37.5566L51.0722 57.8163Z"
                                    fill="#EE766A"
                                />
                                <path
                                    d="M37.6766 38.5376C36.6259 36.7177 33.9992 36.7177 32.9486 38.5376L21.2516 58.7973C20.2009 60.6171 21.5143 62.8919 23.6156 62.8919L47.0095 62.8919C49.1109 62.8919 50.4242 60.6171 49.3735 58.7973L37.6766 38.5376Z"
                                    fill="#EE766A"
                                />
                            </g>
                        </svg>
                    </MenuHexagon>
                    {/* this.state.open &&  */}
                </g>
            </svg>
        );
    }
}
