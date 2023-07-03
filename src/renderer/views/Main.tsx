import React, { useEffect } from 'react';
import 'react-tabs/style/react-tabs.css';
import './Main.less';

import { Asset } from '@kapeta/ui-web-types';
import { useAsyncFn } from 'react-use';
import { toClass } from '@kapeta/ui-web-utils';
import { Plan } from '@kapeta/schemas';
import { SimpleLoader } from '@kapeta/ui-web-components';

import { PlannerService } from '@kapeta/ui-web-context';
import { TopBar } from 'renderer/components/shell/TopBar';
import { useLocalStorage } from '../utils/localStorage';
import { PlanView } from './PlanView';
import { PlanOverview } from '../components/plan-overview/PlanOverview';
import { getAssetTitle } from '../components/plan-editor/helpers';
import { Button, Tab, Tabs } from '@mui/material';
import { TabPanel } from 'renderer/components/shell/TabPanel';

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
    }, [reloadPlans]);

    const [error, setError] = useLocalStorage('$main_error', '');

    const openPlans: Asset<Plan>[] = [];
    if (planAssets.value) {
        openPlanRefs.forEach((ref) => {
            const assetRefs = planAssets.value?.find(
                (asset) => asset.ref === ref
            );
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
                    <>
                        <TopBar>
                            <Tabs
                                sx={(theme) => ({
                                    '& .MuiTabs-indicator': {
                                        display: 'none',
                                    },
                                    '& .MuiButton-root': {
                                        color: theme.palette.common.white,
                                    },
                                })}
                                value={activeTab}
                                // forceRenderTabPanel={false}
                                onChange={(
                                    evt: React.SyntheticEvent,
                                    tabIndex: number
                                ) => {
                                    setActiveTab(tabIndex);
                                }}
                            >
                                {openPlans.map(
                                    (plan: Asset<Plan>, index: number) => {
                                        return (
                                            <Tab
                                                sx={(theme) => ({
                                                    '&.Mui-selected': {
                                                        backgroundColor:
                                                            theme.palette
                                                                .primary.main,
                                                        color: theme.palette
                                                            .common.white,
                                                    },
                                                })}
                                                value={index + 1}
                                                key={plan.ref}
                                                label={
                                                    <div>
                                                        {getAssetTitle(plan)} [
                                                        {plan.version}]{' '}
                                                        <button
                                                            style={{
                                                                all: 'unset',
                                                            }}
                                                            type="button"
                                                            onClick={() => {
                                                                onTabClosed(
                                                                    plan
                                                                );
                                                            }}
                                                        >
                                                            <i className="fal fa-times close-plan" />
                                                        </button>
                                                    </div>
                                                }
                                            />
                                        );
                                    }
                                )}
                                <Button
                                    onClick={() => {
                                        setActiveTab(0);
                                    }}
                                >
                                    <i className="fa fa-plus add-plan" />
                                </Button>
                            </Tabs>
                        </TopBar>

                        {openPlans.map((plan: Asset<Plan>, index: number) => {
                            return (
                                <TabPanel
                                    key={plan.ref}
                                    index={index + 1}
                                    value={activeTab}
                                >
                                    <PlanView
                                        systemId={
                                            openPlans[activeTab - 1]
                                                ? openPlans[activeTab - 1].ref
                                                : ''
                                        }
                                    />
                                </TabPanel>
                            );
                        })}
                        <TabPanel index={0} value={activeTab}>
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
                    </>
                )}
                {error && <div className="error-details">{error}</div>}
            </div>
        </SimpleLoader>
    );
}
