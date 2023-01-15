import React, { Component } from "react";
import { observer } from "mobx-react";
import {action, makeObservable, observable} from "mobx";

import { AssetService } from "@blockware/ui-web-context";
import { InstanceService, InstanceStatus, InstanceEventType } from "@blockware/ui-web-context";
import { DialogControl, SidePanel, showToasty, ToastType, DialogTypes } from "@blockware/ui-web-components";

import {
    PlannerConnectionModelWrapper,
    PlannerModelWrapper,
    PlannerModelRef,
    PlannerConnection,
    PlannerNodeSize,
    PlannerBlockNode
} from "@blockware/ui-web-plan-editor";

import PlanOverviewPlaceHolder from "./PlanOverviewPlaceHolder";
import { MenuItem } from "../menu/MenuDataModel";
import PlanOverviewItem from "./components/PlanOverviewItem"
import {PlanOverviewTopBar} from "./components/PlanOverviewTopBar";

import "./PlanOverview.less";

interface PlanOverviewWrapperProps {
    plans: PlannerModelRef[]
    size: number
    onPlanChanged?: () => void
    itemDeleted?: (plan: PlannerModelRef) => void
    onPlanSelected?: (plan: PlannerModelRef) => void
    onPlanAdded?: (plan: PlannerModelRef) => void
}

interface PlanOverviewWrapperState {
    activePlan: number
    activePlanMenu: number
}

@observer
export default class PlanOverview extends Component<PlanOverviewWrapperProps, PlanOverviewWrapperState>{

    private containerSize: { width: number, height: number };

    @observable
    private open:boolean = true;
    @observable
    private runningBlocks: { [id: string]: { status: InstanceStatus } } = {};

    private unsubscribers: any[];

    private importPlanPanel: SidePanel | null = null;

    constructor(props: PlanOverviewWrapperProps) {
        super(props);
        makeObservable(this);
        props.plans.forEach((plan:PlannerModelRef) => {
            if (!plan.model ||
                !plan.model.blocks) {
                return;
            }
            plan.model.blocks.forEach((block) => {
                this.runningBlocks[block.id] = { status: InstanceStatus.STOPPED };
            });
        });
        InstanceService.getInstanceCurrentStatus().then(res => this.updateRunningBlockStatus(res));

        this.unsubscribers = [];
        this.containerSize = { width: 200, height: 200 }
        this.state = {
            activePlan: -1,
            activePlanMenu: -1
        }
    }

    @action
    private updateRunningBlockStatus(res:any) {
        if (Array.isArray(res)) {
            res.forEach((status: any) => {
                if (this.runningBlocks[status.instanceId] && this.runningBlocks[status.instanceId].status) {
                    this.runningBlocks[status.instanceId].status = status.status;
                }
            });
        }
    }

    private setOpenMenu = (index: number) => {
        if (index === this.state.activePlanMenu) {
            this.setState({ activePlanMenu: -1 })
        } else {
            this.setState({ activePlanMenu: index })
        }
    };

    private onPlanRemove = (item: PlannerModelRef) => {
        try {
            //TODO: animate the item out of the dom and then call itemDeleted
            DialogControl.show("Delete this plan?", item.model.name, () => {
                this.props.itemDeleted && this.props.itemDeleted(item);
                showToasty({ title: "Plan Deleted!", message: "Deleted " + item.model.name + " from your plan list", type: ToastType.ALERT });
                AssetService.remove(item.ref);//res can be saved in a variable as promise
            }, DialogTypes.DELETE)
        } catch (e) {
            return false;
        }
        return true;
    }
    private renderMiniPlan = (item: PlannerModelWrapper) => {

        const planSize = item.calculateCanvasSize(this.props.size, this.containerSize);

        return (
            <svg y={20} x={0} width={200} height={250} viewBox={`0 0 ${planSize.width} ${planSize.height}`} className="mini-plan">
                {
                    item.connections.map((connection) => {
                        return (
                            <PlannerConnection
                                key={connection.id}
                                size={PlannerNodeSize.SMALL}
                                setItemToEdit={(item, type) => { }}
                                handleInspectClick={(connection: PlannerConnectionModelWrapper) => { }}
                                onFocus={() => { }}
                                onDelete={() => { }}
                                connection={connection} />
                        )
                    })
                }

                {item.blocks.map((block, index) => {
                    const runningBlock = this.runningBlocks[block.id];
                    return (
                        <PlannerBlockNode
                            status={runningBlock ? runningBlock.status : InstanceStatus.STOPPED}
                            key={block.id + block.name}
                            block={block}
                            onDoubleTap={()=>{ }}
                            zoom={1}
                            readOnly={true}
                            size={PlannerNodeSize.SMALL}
                            setItemToEdit={(item, type) => { }}
                            planner={item}
                        />)
                })
                }
            </svg>
        )
    };


    private onImportDone() {
        this.importPlanPanel && this.importPlanPanel.close();
        this.props.onPlanChanged && this.props.onPlanChanged();
    }
    private onInstanceStatusChanged = (message: any) => {
        this.runningBlocks[message.instanceId] = { status: message.status }
    };

    componentDidMount() {
        console.log("Subscribing to instance state ");
        this.unsubscribers = this.props.plans.map(plan => {
            return InstanceService.subscribe(plan.ref, InstanceEventType.EVENT_INSTANCE_CHANGED, this.onInstanceStatusChanged);
        });
    }

    componentWillUnmount() {
        this.props.plans.forEach((plan, index) => {
            InstanceService.unsubscribe(plan.ref, InstanceEventType.EVENT_INSTANCE_CHANGED, this.unsubscribers[index])
        })
    }

    render() {
        if (this.props.plans.length < 1) {
            return (
                <div style={{ position: "relative" }}>
                    <PlanOverviewTopBar
                        open={this.open}
                        onClose={() => { this.importPlanPanel && this.importPlanPanel.close(); }}
                        onDone={() => {
                            this.onImportDone()
                        }}
                        skipFiles={this.props.plans.map(plan => {
                            return plan.ref;
                        })}
                    />
                    <PlanOverviewPlaceHolder>
                        <p> No plans found please open existing plans or create a new one </p>
                    </PlanOverviewPlaceHolder>
                </div>
            )

        } else {

            return (

                <div style={{ position: "relative" }}>
                    <PlanOverviewTopBar
                        open={this.open}
                        onClose={() => { this.importPlanPanel && this.importPlanPanel.close(); }}
                        onDone={() => {
                            this.onImportDone()
                        }}
                        skipFiles={this.props.plans.map(plan => {
                            return plan.ref;
                        })}
                    />

                    <div className={"plan-overview-wrapper"}>

                        {
                            this.props.plans.map((item: PlannerModelRef, index) => {

                                //overwrite the callback now that we have hold of the plannerModelRef that we want to delete
                                let menuItem: MenuItem[] = [];
                                menuItem.push({
                                    text: "Delete", callback: () => { return this.onPlanRemove(item) }
                                });

                                return <PlanOverviewItem
                                    name={item.model.name}
                                    key={`plan_${index}`}
                                    version={item.version}
                                    index={index}
                                    activeMenu={this.state.activePlanMenu}
                                    menuItems={menuItem}
                                    onClick={() => { this.props.onPlanSelected && this.props.onPlanSelected(item) }}
                                    toggleMenu={(indexIn: number) => {
                                        this.setOpenMenu(indexIn)
                                    }}
                                    size={200} >
                                    {this.renderMiniPlan(item.model)}
                                </PlanOverviewItem>
                            })
                        }
                    </div >
                </div>
            );
        }
    }


}
