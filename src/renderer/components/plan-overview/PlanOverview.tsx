import React, { ForwardedRef, forwardRef, useState } from 'react';

import { AssetService, BlockService } from '@kapeta/ui-web-context';
import { showDelete, showToasty, ToastType } from '@kapeta/ui-web-components';

import {
    Planner2,
    PlannerMode,
    withPlannerContext,
} from '@kapeta/ui-web-plan-editor';

import { Asset } from '@kapeta/ui-web-types';
import PlanOverviewPlaceHolder from './PlanOverviewPlaceHolder';
import { MenuItem } from '../menu/MenuDataModel';
import { PlanOverviewItem } from './PlanOverviewItem';
import { PlanOverviewTopBar } from './PlanOverviewTopBar';

import './PlanOverview.less';
import { Plan } from '@kapeta/schemas';
import { useAsync } from 'react-use';
import { getAssetTitle } from '../plan-editor/helpers';

interface MiniPlanProps {
    systemId: string;
}

const MiniPlan = withPlannerContext(
    forwardRef((props: MiniPlanProps, ref: ForwardedRef<HTMLDivElement>) => {
        return <div ref={ref}>Plan goes here</div>;
    })
);

interface Props {
    plans: Asset<Plan>[];
    size: number;
    onPlanChanged?: () => void;
    onAssetAdded?: (asset: Asset) => void;
    itemDeleted?: (plan: Asset<Plan>) => void;
    onPlanSelected?: (plan: Asset<Plan>) => void;
}

export const PlanOverview = (props: Props) => {
    const [activePlanMenu, setActivePlanMenu] = useState(-1);

    const blockAssets = useAsync(async () => BlockService.list(), []);

    const setOpenMenu = (index: number) => {
        if (index === activePlanMenu) {
            setActivePlanMenu(-1);
        } else {
            setActivePlanMenu(index);
        }
    };

    const onPlanRemove = async (plan: Asset<Plan>) => {
        try {
            const confirm = await showDelete(
                'Delete plan',
                'Are you sure you want to delete plan?'
            );

            if (!confirm) {
                return;
            }
            await AssetService.remove(plan.ref);
            props.itemDeleted && props.itemDeleted(plan);
            showToasty({
                title: 'Plan Deleted!',
                message: `Deleted ${getAssetTitle(plan)} from your plan list`,
                type: ToastType.ALERT,
            });
        } catch (e) {
            return false;
        }
        return true;
    };

    const onPlanCreated = (asset?: Asset) => {
        props.onPlanChanged && props.onPlanChanged();
        if (asset && props.onAssetAdded) {
            props.onAssetAdded(asset);
        }
    };

    if (props.plans.length < 1) {
        return (
            <div style={{ position: 'relative' }}>
                <PlanOverviewTopBar
                    onDone={(asset) => {
                        onPlanCreated(asset);
                    }}
                    skipFiles={props.plans.map((plan) => {
                        return plan.ref;
                    })}
                />
                <PlanOverviewPlaceHolder>
                    <p>
                        {' '}
                        No plans found please open existing plans or create a
                        new one{' '}
                    </p>
                </PlanOverviewPlaceHolder>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            <PlanOverviewTopBar
                onDone={(asset) => {
                    onPlanCreated(asset);
                }}
                skipFiles={props.plans.map((plan) => {
                    return plan.ref;
                })}
            />

            <div className="plan-overview-wrapper">
                {props.plans.map((asset: Asset<Plan>, index) => {
                    // overwrite the callback now that we have hold of the plannerModelRef that we want to delete
                    const menuItem: MenuItem[] = [];
                    menuItem.push({
                        text: 'Delete',
                        callback: () => {
                            return onPlanRemove(asset);
                        },
                    });

                    return (
                        <PlanOverviewItem
                            name={getAssetTitle(asset)}
                            key={asset.ref}
                            version={asset.version}
                            index={index}
                            activeMenu={activePlanMenu}
                            menuItems={menuItem}
                            onClick={() => {
                                props.onPlanSelected &&
                                    props.onPlanSelected(asset);
                            }}
                            toggleMenu={(indexIn: number) => {
                                setOpenMenu(indexIn);
                            }}
                        >
                            <MiniPlan
                                systemId={asset.ref}
                                plan={asset.data}
                                blockAssets={blockAssets.value ?? []}
                                mode={PlannerMode.VIEW}
                            />
                        </PlanOverviewItem>
                    );
                })}
            </div>
        </div>
    );
};
