import React, { useState } from 'react';

import { AssetService, AssetStore } from '@kapeta/ui-web-context';
import {
    showToasty,
    ToastType,
    useConfirmDelete,
} from '@kapeta/ui-web-components';
import { Plan } from '@kapeta/schemas';
import { getAssetTitle } from '../plan-editor/helpers';
import { GetStartedHeader } from './components/GetStartedHeader';
import { SamplePlanSection } from './components/SamplePlanSection';
import { Box, Stack } from '@mui/material';
import { YourPlansList } from './components/YourPlansList';
import { PlanCreator } from '../creators/PlanCreator';
import { AssetCreatorState } from '../creators/AssetCreator';
import { AssetInfo } from '@kapeta/ui-web-plan-editor';

interface Props {
    plans: AssetInfo<Plan>[];
    sample?: AssetInfo<Plan>;
    assetService?: AssetStore;
    onPlanAdded?: (plan: AssetInfo<Plan>) => void;
    onPlanRemoved?: (plan: AssetInfo<Plan>) => void;
    onPlanSelected?: (plan: AssetInfo<Plan>) => void;
}

export const PlanOverview = (props: Props) => {
    const [creatorState, setCreatorState] = useState<AssetCreatorState>(
        AssetCreatorState.CLOSED
    );

    const showDelete = useConfirmDelete();

    const onPlanRemove = async (plan: AssetInfo<Plan>) => {
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

    const onPlanCreated = (asset: AssetInfo<Plan>) => {
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
                pl: 2,
                pr: 2,
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
