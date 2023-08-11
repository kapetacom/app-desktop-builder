import React, { useState } from 'react';

import { AssetService, AssetStore } from '@kapeta/ui-web-context';
import { showDelete, showToasty, ToastType } from '@kapeta/ui-web-components';
import { Asset } from '@kapeta/ui-web-types';
import { Plan } from '@kapeta/schemas';
import { getAssetTitle } from '../plan-editor/helpers';
import { GetStartedHeader } from './components/GetStartedHeader';
import { SamplePlanSection } from './components/SamplePlanSection';
import { Box, Stack } from '@mui/material';
import { YourPlansList } from './components/YourPlansList';
import { PlanCreator } from '../creators/PlanCreator';
import { AssetCreatorState } from '../creators/AssetCreator';

interface Props {
    plans: Asset<Plan>[];
    sample?: Asset<Plan>;
    assetService?: AssetStore;
    onPlanAdded?: (plan: Asset<Plan>) => void;
    onPlanRemoved?: (plan: Asset<Plan>) => void;
    onPlanSelected?: (plan: Asset<Plan>) => void;
}

export const PlanOverview = (props: Props) => {
    const [creatorState, setCreatorState] = useState<AssetCreatorState>(
        AssetCreatorState.CLOSED
    );

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
            props.onPlanRemoved && props.onPlanRemoved(plan);
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

    const onPlanCreated = (asset: Asset) => {
        props.onPlanAdded && props.onPlanAdded(asset);
        props.onPlanSelected && props.onPlanSelected(asset);
    };

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                overflow: 'auto',
                bgcolor: 'white',
            }}
        >
            <Box sx={{ pt: '50px' }}></Box>
            <Stack
                direction={'column'}
                sx={{
                    margin: '0 auto',
                    maxWidth: '1152px',
                }}
            >
                <GetStartedHeader
                    onPlanCreate={() => {
                        setCreatorState(AssetCreatorState.CREATING);
                    }}
                    onPlanImport={() => {
                        setCreatorState(AssetCreatorState.IMPORTING);
                    }}
                />
                {props.plans.length < 1 && props.sample && (
                    <SamplePlanSection
                        sample={props.sample}
                        onOpenSample={props.onPlanSelected}
                    />
                )}
                <YourPlansList
                    onPlanOpen={props.onPlanSelected}
                    onPlanCreate={() => {
                        setCreatorState(AssetCreatorState.CREATING);
                    }}
                    onPlanImport={() => {
                        setCreatorState(AssetCreatorState.IMPORTING);
                    }}
                    plans={props.plans}
                />
            </Stack>
            {props.assetService && (
                <PlanCreator
                    state={creatorState}
                    assetService={props.assetService}
                    onDone={(newPlan) => {
                        setCreatorState(AssetCreatorState.CLOSED);
                        if (newPlan) {
                            onPlanCreated(newPlan);
                        }
                    }}
                    skipFiles={props.plans.map((plan) => {
                        return plan.ref;
                    })}
                />
            )}
            <Box sx={{ pb: 4 }}></Box>
        </Box>
    );
};
