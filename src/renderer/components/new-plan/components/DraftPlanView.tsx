/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { BlockDefinition, Plan } from '@kapeta/schemas';
import { AssetInfo, Planner, PlannerMode, withPlannerContext } from '@kapeta/ui-web-plan-editor';
import { useLoadedPlanContext } from 'renderer/utils/planContextLoader';
import { useMemo } from 'react';
import { Box } from '@mui/system';
import { Button, Paper } from '@mui/material';

const BasicPlanner = withPlannerContext(React.forwardRef(Planner));

const planRef = 'generated/plan:local';
const emptyPlan: Plan = {
    kind: 'core/plan',
    metadata: {
        name: 'My Plan',
        description: 'My Plan',
        version: '1.0.0',
    },
    spec: {
        connections: [],
        blocks: [],
    },
};

export const DraftPlanView = (props: { plan?: Plan; blocks?: BlockDefinition[]; onSubmit: () => void }) => {
    const planContext = useLoadedPlanContext(props.plan || emptyPlan);
    const planAsset: AssetInfo<Plan> = useMemo(() => {
        return {
            content: props.plan!,
            ref: planRef,
            version: 'local',
        };
    }, [props.plan]);
    const blockAssets: AssetInfo<BlockDefinition>[] = useMemo(() => {
        return (
            props.blocks?.map((block) => {
                return {
                    content: block,
                    ref: `${block.metadata.name}:local`,
                    version: 'local',
                };
            }) || []
        );
    }, [props.blocks]);

    return (
        <Box
            sx={{
                backgroundColor: '#F6F1EE',
                flexGrow: 1,
                zIndex: 1,
                position: 'relative',
                pt: '52px',
            }}
        >
            <Paper
                data-kap-id={'draft-plan-top-menu'}
                elevation={0}
                sx={{
                    padding: '7px 10px',
                    position: 'absolute',
                    borderRadius: 0,
                    top: 0,
                    left: 0,
                    // borderLeft: `1px solid ${grey[200]}`,
                    right: 0,
                    height: '52px',
                    zIndex: 6,
                    boxSizing: 'border-box',
                }}
            >
                <Button onClick={props.onSubmit}>Use this plan</Button>
            </Paper>
            {planContext.loading || !props.plan || !props.blocks ? (
                <div>Loading...</div>
            ) : (
                <BasicPlanner
                    systemId={planRef}
                    mode={PlannerMode.VIEW}
                    plan={props.plan}
                    asset={planAsset}
                    blockAssets={blockAssets}
                />
            )}
        </Box>
    );
};
