import React, { ForwardedRef, forwardRef, useState } from 'react';

import { AssetService } from '@kapeta/ui-web-context';
import { showDelete, showToasty, ToastType } from '@kapeta/ui-web-components';
import { useNavigate } from 'react-router-dom';

import { PlannerMode, withPlannerContext } from '@kapeta/ui-web-plan-editor';

import { Asset } from '@kapeta/ui-web-types';
import { Plan } from '@kapeta/schemas';
import PlanOverviewPlaceHolder from './PlanOverviewPlaceHolder';
import { MenuItem } from '../menu/MenuDataModel';
import { PlanOverviewItem } from './PlanOverviewItem';
import { PlanOverviewTopBar } from './PlanOverviewTopBar';

import './PlanOverview.less';
import { getAssetTitle } from '../plan-editor/helpers';
import {
    useAssets,
    useBlockAssets,
    useBlockKinds,
} from '../../utils/planContextLoader';

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
    onPlanChanged?: () => void;
    onAssetAdded?: (asset: Asset) => void;
    itemDeleted?: (plan: Asset<Plan>) => void;
}

export const PlanOverview = (props: Props) => {
    const navigateTo = useNavigate();
    const [activePlanMenu, setActivePlanMenu] = useState(-1);

    const assets = useAssets();
    const blockTypeKinds = useBlockKinds(assets);
    const blockAssets = useBlockAssets(assets, blockTypeKinds);

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
                return false;
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
            navigateTo(`/edit/${encodeURIComponent(asset.ref)}`);
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
                                navigateTo(
                                    `/edit/${encodeURIComponent(asset.ref)}`,
                                    {}
                                );
                            }}
                            toggleMenu={(indexIn: number) => {
                                setOpenMenu(indexIn);
                            }}
                        >
                            <MiniPlan
                                systemId={asset.ref}
                                plan={asset.data}
                                blockAssets={blockAssets}
                                mode={PlannerMode.VIEW}
                            />
                        </PlanOverviewItem>
                    );
                })}
            </div>
        </div>
    );
};
