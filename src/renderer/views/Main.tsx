import React, {useEffect} from "react";
import {Tab, TabList, TabPanel, Tabs} from "react-tabs";
import 'react-tabs/style/react-tabs.css';
import './Main.less';
import {
    PlannerModelRef,
    PlannerModelReader
} from "@blockware/ui-web-plan-editor";
import PlanView from "./PlanView";
import PlanOverview from "renderer/components/plan-overview/PlanOverview";

import {BlockService, PlannerService} from "@blockware/ui-web-context";
import {Asset, PlanKind} from "@blockware/ui-web-types";
import {useList} from 'react-use';
import {toClass} from "@blockware/ui-web-utils";
import {useLocalStorage} from "../utils/localStorage";
import {showToasty, ToastType} from "@blockware/ui-web-components";


export default function Main() {

    const [activeTab, setActiveTab] = useLocalStorage<number>('$main_activeTab',0);
    const [openPlanRefs, setOpenPlanRefs] = useLocalStorage<string[]>('$main_openPlans',[]); // might need manual serialization
    const [planModelRefs, {set:setPlanModels, push:pushPlanModels, removeAt:removePlanModels}] = useList<PlannerModelRef>([]);
    const [error, setError] = useLocalStorage('$main_error','');

    const openPlans:PlannerModelRef[] = [];
    openPlanRefs
        .forEach(ref => {
            const modelRef = planModelRefs.find(model => model.ref === ref);
            if (modelRef) {
                openPlans.push(modelRef);
            }
        })

    const reader: PlannerModelReader = new PlannerModelReader(BlockService);

    const loadPlans = async () => {
        let planAssets: Asset<PlanKind>[] = [];
        try {
            setError('');
            planAssets = await PlannerService.list();
        } catch (e:any) {
            setError('Failed to load plans: ' + e.message);
            return;
        }

        const planPromises: Promise<PlannerModelRef>[] = planAssets.map(async (planAsset: Asset<PlanKind>): Promise<PlannerModelRef> => {
            return {
                ref: planAsset.ref,
                version: planAsset.version,
                model: await reader.load(planAsset.data, planAsset.ref)
            }
        });

        try {
            const planListResults: PromiseSettledResult<PlannerModelRef>[] = await Promise.allSettled(planPromises);
            const planList:PlannerModelRef[] = [];
            planListResults.forEach(plan => {
                if (plan.status === 'fulfilled') {
                    planList.push(plan.value);
                } else {
                    console.error('Failed to load plan', plan.reason);
                    showToasty({
                        title:'Failed to load plan',
                        type: ToastType.DANGER,
                        message: '' + plan.reason
                    })
                }
            })
            setPlanModels(planList)
        } catch (e:any) {
            setError('Failed to load plans models: ' + e.message);
            return;
        }
    };

    useEffect(() => {
        loadPlans();
        // eslint-disable-next-line
    }, []);

    const onPlanSelected = (plan: PlannerModelRef) => {
        const items = openPlans.filter((openPlan: PlannerModelRef) => {
            return openPlan.ref === plan.ref;
        })
        const exists = items.length > 0;
        if (exists) {

            setActiveTab(openPlans.findIndex((openPlan) => (openPlan.ref === plan.ref)));//set the tab equal to the index of the clicked plan in the openPlans
        } else {
            openPlans.push(plan);
            setOpenPlanRefs(openPlans.map(p => p.ref));
            setActiveTab(openPlans.indexOf(plan));
        }
    }

    const onTabClosed = (plan: PlannerModelRef) => {
        const newOpenPlans = openPlans.filter((openPlan: PlannerModelRef) => {
            return openPlan.ref !== plan.ref;
        })
        setOpenPlanRefs(newOpenPlans.map(p => p.ref))
        if (newOpenPlans.length > 0) {
            setActiveTab(newOpenPlans.length - 1)
        }
    }

    toClass({
        'main-container': true,
        'error': !!error
    });

    return (
        <div className="main-container">
            {!error &&
                <Tabs selectedIndex={activeTab} forceRenderTabPanel={false} onSelect={(tabIndex: number) => {
                    setActiveTab(tabIndex)
                }}>
                    <TabList>
                        {
                            openPlans.map((plan: PlannerModelRef, index: number) => {
                                return <Tab key={index}>
                                    <div className={index !== activeTab - 1 && index !== activeTab ? "separator" : ""}>
                                        {plan.model.name} [{plan.version}] <i onClick={() => {
                                        onTabClosed(plan);
                                    }} className="fal fa-times close-plan"></i>
                                    </div>
                                </Tab>
                            })}

                        <Tab> <i className="fa fa-plus add-plan"></i></Tab>
                    </TabList>
                    {
                        openPlans.map((plan: PlannerModelRef, index: number) => {
                            return (
                                <TabPanel key={index}>
                                    <PlanView planRef={openPlans[activeTab] ? openPlans[activeTab].ref : ""}/>
                                </TabPanel>);
                        })
                    }
                    <TabPanel>
                        <PlanOverview
                            onPlanSelected={onPlanSelected}
                            size={400}
                            onPlanChanged={loadPlans}
                            itemDeleted={(plan) => {
                                onTabClosed(plan);
                                removePlanModels(planModelRefs.findIndex((deletedPlan: PlannerModelRef) => {
                                    return deletedPlan.ref === plan.ref;
                                }));
                            }}
                            onPlanAdded={(plan) => {
                                pushPlanModels(plan)
                            }}
                            plans={planModelRefs || []}/>
                    </TabPanel>
                </Tabs>
            }
            {error &&
                <div className={'error-details'}>{error}</div>
            }
        </div>
    )
}
