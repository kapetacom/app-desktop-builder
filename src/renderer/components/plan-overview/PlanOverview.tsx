import React, { useState } from 'react';

import { AssetStore } from '@kapeta/ui-web-context';
import { CoreTypes } from '@kapeta/ui-web-components';
import { Plan } from '@kapeta/schemas';
import { GetStartedHeader } from './components/GetStartedHeader';
import { SamplePlanSection } from './components/SamplePlanSection';
import { Box, Stack } from '@mui/material';
import { YourPlansList } from './components/YourPlansList';
import { PlanCreator } from '../creators/PlanCreator';
import { AssetCreatorState } from '../creators/AssetCreator';
import { AssetInfo, fromAsset } from '@kapeta/ui-web-plan-editor';
import { useAssetImporter } from '../../utils/useAssetImporter';

interface Props {
    plans: AssetInfo<Plan>[];
    sample?: AssetInfo<Plan>;
    assetService?: AssetStore;
    onPlanImported?: (plan: AssetInfo<Plan>) => void;
    onPlanAdded?: (plan: AssetInfo<Plan>) => void;
    onPlanRemoved?: (plan: AssetInfo<Plan>) => void;
    onPlanSelected?: (plan: AssetInfo<Plan>) => void;
}

export const PlanOverview = (props: Props) => {
    const [creatorState, setCreatorState] = useState<AssetCreatorState>(
        AssetCreatorState.CLOSED
    );

    const assetImporter = useAssetImporter({
        assetService: props.assetService,
        allowedKinds: [CoreTypes.PLAN],
    });

    const onPlanCreated = (asset: AssetInfo<Plan>) => {
        props.onPlanAdded && props.onPlanAdded(asset);
        props.onPlanSelected && props.onPlanSelected(asset);
    };

    const onPlanImport = async () => {
        const assets = await assetImporter.importAsset();
        if (assets && assets.length > 0) {
            props.onPlanImported && props.onPlanImported(fromAsset(assets[0]));
        }
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
                    assetImporter={assetImporter}
                    onPlanCreate={() => {
                        setCreatorState(AssetCreatorState.CREATING);
                    }}
                    onPlanImport={onPlanImport}
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
                    onPlanImport={onPlanImport}
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
