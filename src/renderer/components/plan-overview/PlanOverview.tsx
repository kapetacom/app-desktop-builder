/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useMemo, useState } from 'react';

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
import { parseKapetaUri } from '@kapeta/nodejs-utils';

interface Props {
    plans: AssetInfo<Plan>[];
    samplePlanName?: string;
    assetService?: AssetStore;
    onPlanImported?: (plan: AssetInfo<Plan>) => void;
    onPlanAdded?: (plan: AssetInfo<Plan>) => void;
    onPlanRemoved?: (plan: AssetInfo<Plan>) => void;
    onPlanSelected?: (plan: AssetInfo<Plan>) => void;
}

export const PlanOverview = (props: Props) => {
    const [creatorState, setCreatorState] = useState<AssetCreatorState>(AssetCreatorState.CLOSED);

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

    const { plans, samplePlan } = useMemo(() => {
        const samplePlan = props.plans.find((plan) => {
            return parseKapetaUri(plan.ref).fullName === props.samplePlanName;
        });
        let plans = [...props.plans];
        if (samplePlan && props.plans.length === 1) {
            plans = [];
        }

        return {
            samplePlan,
            plans,
        };
    }, [props.plans, props.samplePlanName]);

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
                pt: '50px',
            }}
        >
            <Stack
                sx={{
                    margin: '0 auto',
                    maxWidth: '1152px',
                }}
                gap={4}
            >
                <GetStartedHeader
                    assetImporter={assetImporter}
                    onPlanCreate={() => {
                        setCreatorState(AssetCreatorState.CREATING);
                    }}
                    onPlanImport={onPlanImport}
                />
                {plans.length < 1 && samplePlan && (
                    <SamplePlanSection sample={samplePlan} onOpenSample={props.onPlanSelected} />
                )}
                <YourPlansList
                    onPlanOpen={props.onPlanSelected}
                    onPlanCreate={() => {
                        setCreatorState(AssetCreatorState.CREATING);
                    }}
                    onPlanImport={onPlanImport}
                    plans={plans}
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
