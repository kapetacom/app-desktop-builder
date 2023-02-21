import React, { Component } from 'react';
import { toClass } from '@blockware/ui-web-utils';
import { SVGText } from '@blockware/ui-web-components';

import { MenuItem } from '../../menu/MenuDataModel';
import MenuItems from '../../menu/MenuItems';

import PlanOverviewItemHexagon from './PlanOverviewItemHexagon';

interface PlanOverviewPlannerWrapperProps {
    children: JSX.Element;
    size: number;
    name: string;
    version: string;
    onClick: () => void;
    menuItems: MenuItem[];
    index: number;
    activeMenu: number;
    toggleMenu: (index: number) => void;
}

export default class PlanOverviewItem extends Component<PlanOverviewPlannerWrapperProps> {
    render() {
        const classNames = toClass({
            'sub-plan-overview-menu': true,
            'active-menu': this.props.activeMenu === this.props.index,
        });

        return (
            <div className="plan-overview-item-wrapper">
                <svg className={'overview-item'} width="200" height="150">
                    <PlanOverviewItemHexagon onClick={this.props.onClick} />
                    {this.props.children}
                    <g className={classNames}>
                        <MenuItems
                            closeMenu={() => {
                                this.props.toggleMenu(-1);
                            }}
                            menuItems={this.props.menuItems}
                            visible={true}
                        />
                    </g>
                    <foreignObject
                        className="overview-item-menu"
                        x={75}
                        y={280}
                        width={50}
                        height={50}
                        onClick={() => {
                            this.props.toggleMenu(this.props.index);
                        }}
                    >
                        <i className="fa fa-ellipsis-v" />
                    </foreignObject>
                </svg>
                <svg>
                    <SVGText
                        className={'plan-title'}
                        x={150}
                        y={120}
                        maxWidth={400}
                        value={this.props.name}
                    />
                    <SVGText
                        className={'plan-version'}
                        x={150}
                        y={140}
                        maxWidth={300}
                        value={this.props.version}
                    />
                </svg>
            </div>
        );
    }
}
