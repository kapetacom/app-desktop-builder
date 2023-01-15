import React, {Component} from "react";
import {Planner, PlannerMode, PlannerModelReader, PlannerModelWrapper} from "@blockware/ui-web-plan-editor";
import {Lambda, reaction} from "mobx";
import _ from 'lodash';

import {Loader} from "@blockware/ui-web-components";
import {AssetService, BlockService, InstanceService} from "@blockware/ui-web-context";

import Menu from "../components/menu/MenuWrapper";
import BlockStore from "../components/blocks/store/BlockStore";

import './PlanView.less';

interface PlanViewProps{
    planRef:string
}

class PlanView extends Component<PlanViewProps, any>{

    private reader: PlannerModelReader;

    private planModelObserver?: Lambda;

    constructor(props: any) {
        super(props);
        this.reader = new PlannerModelReader(BlockService);
    }

    componentWillUnmount() {
        this.cleanupObserver();
    }

    private cleanupObserver() {
        if (this.planModelObserver) {
            this.planModelObserver();
            this.planModelObserver = undefined;
        }
    }

    private async handlePlanModelChange(ref: string, model: PlannerModelWrapper) {
        await AssetService.update(ref, model.getData());
    }

    private async renderPlan() {
        if (!this.props.planRef) {
            return (
                <p>No reference found</p>
            );
        }

        this.cleanupObserver();

        const asset = await AssetService.get(this.props.planRef);
        const model = await this.reader.load(asset.data, this.props.planRef);

        let ref = this.props.planRef;
        if (ref.indexOf('://') > -1) {
            ref = ref.split('://')[1];
        }

        const [,version] = ref.split(':');

        if (!version ||
            version.toLowerCase() !== 'local') {
            //We can only edit local versions
            model.setMode(PlannerMode.VIEW);
        }

        this.planModelObserver = reaction(() => model, _.debounce(async () => {
            await this.handlePlanModelChange(this.props.planRef, model);
        }, 1000));

        return (
            <div className={'plan-view'}>
                <Planner plan={model}
                         systemId={this.props.planRef}
                         blockStore={() => <BlockStore />}
                         enableInstanceListening={true}  />
                <Menu menuCategoryItems={[
                    {
                        open: false,
                        index: 1,
                        text: "1",
                        icon: "fa-running",
                        menuItems: [
                            {
                                text: "Stop all",
                                callback: () => {
                                    InstanceService.stopInstances(this.props.planRef);
                                    return true;
                                }
                            },
                            {
                                text: "Start all",
                                callback: () => {
                                    InstanceService.startInstances(this.props.planRef);
                                    return true;
                                }
                            }
                        ]
                    }]}
                />
            </div>
        )
    }

    render() {
        return (
            <Loader load={() => this.renderPlan()} />
        )
    }
}

export default PlanView;


