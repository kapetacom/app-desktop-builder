import React, { Component } from 'react';

import {
    AssetService,
    InstanceService,
    InstanceStatus,
    InstanceEventType,
} from '@blockware/ui-web-context';
import {
    DialogControl,
    showToasty,
    ToastType,
    DialogTypes,
} from '@blockware/ui-web-components';

import {
    PlannerModelWrapper,
    PlannerModelRef,
    PlannerConnection,
    PlannerNodeSize,
    PlannerBlockNode,
} from '@blockware/ui-web-plan-editor';

import { Asset } from '@blockware/ui-web-types';
import PlanOverviewPlaceHolder from './PlanOverviewPlaceHolder';
import { MenuItem } from '../menu/MenuDataModel';
import { PlanOverviewItem } from './PlanOverviewItem';
import { PlanOverviewTopBar } from './PlanOverviewTopBar';

import './PlanOverview.less';

interface PlanOverviewWrapperProps {
    plans: PlannerModelRef[];
    size: number;
    onPlanChanged?: () => void;
    onAssetAdded?: (asset: Asset) => void;
    itemDeleted?: (plan: PlannerModelRef) => void;
    onPlanSelected?: (plan: PlannerModelRef) => void;
}

type InstanceStatusMap = { [id: string]: { status: InstanceStatus } };

interface PlanOverviewWrapperState {
    activePlanMenu: number;
    runningBlocks: InstanceStatusMap;
}

export default class PlanOverview extends Component<
    PlanOverviewWrapperProps,
    PlanOverviewWrapperState
> {
    private readonly containerSize: { width: number; height: number };

    private unsubscribers: any[] = [];

    constructor(props: PlanOverviewWrapperProps) {
        super(props);

        this.containerSize = { width: 200, height: 200 };

        const runningBlocks: InstanceStatusMap = {};
        props.plans.forEach((plan: PlannerModelRef) => {
            if (!plan.model || !plan.model.blocks) {
                return;
            }
            plan.model.blocks.forEach((block) => {
                runningBlocks[block.id] = {
                    status: InstanceStatus.STOPPED,
                };
            });
        });
        InstanceService.getInstanceCurrentStatus()
            .then((res) => this.updateRunningBlockStatus(res))
            .catch(() => {
                // Ignore
            });

        this.state = {
            activePlanMenu: -1,
            runningBlocks,
        };
    }

    private updateRunningBlockStatus(res: any) {
        if (Array.isArray(res)) {
            this.setState((prevState) => {
                const runningBlocks = { ...prevState.runningBlocks };
                res.forEach((status: any) => {
                    if (
                        runningBlocks[status.instanceId] &&
                        runningBlocks[status.instanceId].status
                    ) {
                        runningBlocks[status.instanceId].status = status.status;
                    }
                });

                return {
                    runningBlocks,
                };
            });
        }
    }

    private setOpenMenu = (index: number) => {
        if (index === this.state.activePlanMenu) {
            this.setState({ activePlanMenu: -1 });
        } else {
            this.setState({ activePlanMenu: index });
        }
    };

    private onPlanRemove = (item: PlannerModelRef) => {
        try {
            // TODO: animate the item out of the dom and then call itemDeleted
            DialogControl.show(
                'Delete this plan?',
                item.model.name,
                () => {
                    this.props.itemDeleted && this.props.itemDeleted(item);
                    showToasty({
                        title: 'Plan Deleted!',
                        message: `Deleted ${item.model.name} from your plan list`,
                        type: ToastType.ALERT,
                    });
                    AssetService.remove(item.ref); // res can be saved in a variable as promise
                },
                DialogTypes.DELETE
            );
        } catch (e) {
            return false;
        }
        return true;
    };

    private renderMiniPlan = (item: PlannerModelWrapper) => {
        const planSize = item.calculateCanvasSize(
            this.props.size,
            this.containerSize
        );

        return (
            <svg
                y={20}
                x={0}
                width={200}
                height={250}
                viewBox={`0 0 ${planSize.width} ${planSize.height}`}
                className="mini-plan"
            >
                {item.connections.map((connection) => {
                    return (
                        <PlannerConnection
                            key={connection.id}
                            size={PlannerNodeSize.SMALL}
                            connection={connection}
                        />
                    );
                })}

                {item.blocks.map((block, index) => {
                    const runningBlock = this.state.runningBlocks[block.id];
                    return (
                        <PlannerBlockNode
                            status={
                                runningBlock
                                    ? runningBlock.status
                                    : InstanceStatus.STOPPED
                            }
                            key={block.id + block.name}
                            block={block}
                            zoom={1}
                            readOnly
                            size={PlannerNodeSize.SMALL}
                            planner={item}
                        />
                    );
                })}
            </svg>
        );
    };

    private onPlanCreated(asset?: Asset) {
        this.props.onPlanChanged && this.props.onPlanChanged();
        if (asset && this.props.onAssetAdded) {
            this.props.onAssetAdded(asset);
        }
    }

    private onInstanceStatusChanged = (message: any) => {
        this.setInstanceStatus(message.instanceId, message.status);
    };

    private setInstanceStatus(id: string, status: InstanceStatus) {
        this.setState((prevState) => {
            return {
                runningBlocks: {
                    ...prevState.runningBlocks,
                    [id]: { status },
                },
            };
        });
    }

    componentDidMount() {
        console.log('Subscribing to instance state ');
        this.unsubscribers = this.props.plans.map((plan) => {
            return InstanceService.subscribe(
                plan.ref,
                InstanceEventType.EVENT_INSTANCE_CHANGED,
                this.onInstanceStatusChanged
            );
        });
    }

    componentWillUnmount() {
        while (this.unsubscribers.length > 0) {
            this.unsubscribers.pop()();
        }
    }

    render() {
        if (this.props.plans.length < 1) {
            return (
                <div style={{ position: 'relative' }}>
                    <PlanOverviewTopBar
                        onDone={(asset) => {
                            this.onPlanCreated(asset);
                        }}
                        skipFiles={this.props.plans.map((plan) => {
                            return plan.ref;
                        })}
                    />
                    <PlanOverviewPlaceHolder>
                        <p>
                            {' '}
                            No plans found please open existing plans or create
                            a new one{' '}
                        </p>
                    </PlanOverviewPlaceHolder>
                </div>
            );
        }
        return (
            <div style={{ position: 'relative' }}>
                <PlanOverviewTopBar
                    onDone={(asset) => {
                        this.onPlanCreated(asset);
                    }}
                    skipFiles={this.props.plans.map((plan) => {
                        return plan.ref;
                    })}
                />

                <div className="plan-overview-wrapper">
                    {this.props.plans.map((item: PlannerModelRef, index) => {
                        // overwrite the callback now that we have hold of the plannerModelRef that we want to delete
                        const menuItem: MenuItem[] = [];
                        menuItem.push({
                            text: 'Delete',
                            callback: () => {
                                return this.onPlanRemove(item);
                            },
                        });

                        return (
                            <PlanOverviewItem
                                name={item.model.name}
                                key={item.model.getRef()}
                                version={item.version}
                                index={index}
                                activeMenu={this.state.activePlanMenu}
                                menuItems={menuItem}
                                onClick={() => {
                                    this.props.onPlanSelected &&
                                        this.props.onPlanSelected(item);
                                }}
                                toggleMenu={(indexIn: number) => {
                                    this.setOpenMenu(indexIn);
                                }}
                            >
                                {this.renderMiniPlan(item.model)}
                            </PlanOverviewItem>
                        );
                    })}
                </div>
            </div>
        );
    }
}
