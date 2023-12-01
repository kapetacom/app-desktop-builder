import React from 'react';
import { BlockDefinition, Plan } from '@kapeta/schemas';
import { AssetInfo, Planner, PlannerMode, withPlannerContext } from '@kapeta/ui-web-plan-editor';
import { useLoadedPlanContext } from 'renderer/utils/planContextLoader';
import { useMemo } from 'react';

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

export const DraftPlanView = (props: { plan?: Plan; blocks?: BlockDefinition[] }) => {
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

    if (planContext.loading || !props.plan || !props.blocks) {
        return <div>Loading...</div>;
    }

    return (
        <BasicPlanner
            systemId={planRef}
            mode={PlannerMode.VIEW}
            plan={props.plan}
            asset={planAsset}
            blockAssets={blockAssets}
        />
    );
};
