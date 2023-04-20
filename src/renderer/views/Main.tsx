import React, {useEffect} from 'react';
import {Tab, TabList, TabPanel, Tabs} from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import './Main.less';
import {PlanOverview} from '../components/plan-overview/PlanOverview';

import {Asset} from '@kapeta/ui-web-types';
import {useAsyncFn} from 'react-use';
import {toClass} from '@kapeta/ui-web-utils';
import {Plan} from '@kapeta/schemas';
import {
    SimpleLoader,
} from '@kapeta/ui-web-components';

import {useLocalStorage} from '../utils/localStorage';
import {PlanView} from './PlanView';
import {PlannerService} from "@kapeta/ui-web-context";
import {getAssetTitle} from "../components/plan-editor/helpers";

export default function Main() {
    const [activeTab, setActiveTab] = useLocalStorage<number>(
        '$main_activeTab',
        0
    );

    const [openPlanRefs, setOpenPlanRefs] = useLocalStorage<string[]>(
        '$main_openPlans',
        []
    );


    let [planAssets, reloadPlans] = useAsyncFn(async () => {
        console.log('Loading plans');
        try {
            setError('');
            return PlannerService.list();
        } catch (e: any) {
            console.log('Failed to load plans', e);
            setError(`Failed to load plans: ${e.message}`);
        }
        return [];
    }, []);

    useEffect(() => {
        reloadPlans();
    }, []);

    const [error, setError] = useLocalStorage('$main_error', '');

    const openPlans: Asset<Plan>[] = [];
    if (planAssets.value) {
        console.log('planAssets.value', planAssets.value);
        openPlanRefs.forEach((ref) => {
            const assetRefs = planAssets.value.find((asset) => asset.ref === ref);
            if (assetRefs) {
                openPlans.push(assetRefs);
            }
        });
    }

    const onPlanSelected = (plan: Asset<Plan>) => {
        const items = openPlans.filter((openPlan: Asset<Plan>) => {
            return openPlan.ref === plan.ref;
        });
        const exists = items.length > 0;
        if (exists) {
            setActiveTab(
                openPlans.findIndex((openPlan) => openPlan.ref === plan.ref)
            ); // set the tab equal to the index of the clicked plan in the openPlans
        } else {
            openPlans.push(plan);
            setOpenPlanRefs(openPlans.map((p) => p.ref));
            setActiveTab(openPlans.indexOf(plan));
        }
    };

    const onAssetAdded = async (asset: Asset<Plan>) => {
        await reloadPlans();
        onPlanSelected(asset);
    };

    const onTabClosed = (plan: Asset<Plan>) => {
        const newOpenPlans = openPlans.filter((openPlan: Asset<Plan>) => {
            return openPlan.ref !== plan.ref;
        });
        setOpenPlanRefs(newOpenPlans.map((p) => p.ref));
        if (newOpenPlans.length > 0) {
            setActiveTab(newOpenPlans.length - 1);
        }
    };

    toClass({
        'main-container': true,
        error: !!error,
    });

    return (
        <SimpleLoader loading={planAssets.loading} text="Loading plans...">
            <div className="main-container">
                {!error && (
                    <Tabs
                        selectedIndex={activeTab}
                        forceRenderTabPanel={false}
                        onSelect={(tabIndex: number) => {
                            setActiveTab(tabIndex);
                        }}
                    >
                        <TabList>
                            {openPlans.map(
                                (plan: Asset<Plan>, index: number) => {
                                    return (
                                        <Tab key={plan.ref}>
                                            <div
                                                className={
                                                    index !== activeTab - 1 &&
                                                    index !== activeTab
                                                        ? 'separator'
                                                        : ''
                                                }
                                            >
                                                {getAssetTitle(plan)} [
                                                {plan.version}]{' '}
                                                <button
                                                    style={{all: 'unset'}}
                                                    type="button"
                                                    onClick={() => {
                                                        onTabClosed(plan);
                                                    }}
                                                >
                                                    <i className="fal fa-times close-plan"/>
                                                </button>
                                            </div>
                                        </Tab>
                                    );
                                }
                            )}

                            <Tab>
                                {' '}
                                <i className="fa fa-plus add-plan"/>
                            </Tab>
                        </TabList>
                        {openPlans.map(
                            (plan: Asset<Plan>, index: number) => {
                                return (
                                    <TabPanel key={plan.ref}>
                                        <PlanView
                                            systemId={
                                                openPlans[activeTab]
                                                    ? openPlans[activeTab].ref
                                                    : ''
                                            }
                                        />
                                    </TabPanel>
                                );
                            }
                        )}
                        <TabPanel>
                            <PlanOverview
                                onPlanSelected={onPlanSelected}
                                onAssetAdded={onAssetAdded}
                                size={400}
                                onPlanChanged={reloadPlans}
                                itemDeleted={(plan) => {
                                    onTabClosed(plan);
                                }}
                                plans={planAssets.value || []}
                            />
                        </TabPanel>
                    </Tabs>
                )}
                {error && <div className="error-details">{error}</div>}
            </div>
        </SimpleLoader>
    );
};
