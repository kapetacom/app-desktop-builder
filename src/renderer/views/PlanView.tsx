import React, { useEffect } from 'react';
import { useAsync, useAsyncRetry } from 'react-use';
import { PlannerMode } from '@kapeta/ui-web-plan-editor';

import {
    AssetService,
    InstanceEventType,
    InstanceService,
    InstanceStatus,
} from '@kapeta/ui-web-context';

import './PlanView.less';
import { Plan } from '@kapeta/schemas';
import { Asset } from '@kapeta/ui-web-types';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { SimpleLoader } from '@kapeta/ui-web-components';
import { PlanEditor } from '../components/plan-editor/PlanEditor';
import {withLoadedPlanContext} from "../utils/planContextLoader";

interface PlanViewProps {
    systemId: string;
}

export const PlanView = (props: PlanViewProps) => {
    const planData = useAsync(async (): Promise<Asset<Plan>> => {
        return AssetService.get(props.systemId);
    }, [props.systemId]);

    let plannerMode: PlannerMode = PlannerMode.EDIT;

    const uri = parseKapetaUri(props.systemId);

    if (uri.version !== 'local') {
        // We can only edit local versions
        plannerMode = PlannerMode.CONFIGURATION;
    }


    const instanceStatus = useAsyncRetry(async () => {
        const statuses = await InstanceService.getInstanceStatusForPlan(
            props.systemId
        );
        const result: Record<string, InstanceStatus> = {};
        statuses.forEach((status) => {
            result[status.instanceId] = status.status;
        });
        return result;
    });

    // subscribe and reload instance status
    useEffect(
        () =>
            InstanceService.subscribe(
                props.systemId,
                InstanceEventType.EVENT_INSTANCE_CHANGED,
                () => instanceStatus.retry()
            ),
        [instanceStatus, props.systemId]
    );

    const {
        resourceAssets,
        blocks,
        loading,
        currentlyLoading
    } = withLoadedPlanContext(planData.value?.data);

    let loadingText = 'Loading plan...';

    if (!planData.loading && loading) {
        loadingText = 'Loading plugins...';
        if (currentlyLoading) {
            loadingText = `Loading plugin ${currentlyLoading}...`;
        }
    }

    return (
        <SimpleLoader
            loading={planData.loading || loading}
            text={loadingText}
        >
            {planData.value && resourceAssets && blocks && (
                <PlanEditor
                    plan={planData.value.data}
                    resourceAssets={resourceAssets}
                    instanceStates={instanceStatus.value ?? {}}
                    mode={plannerMode}

                    systemId={props.systemId}
                    onChange={async (plan) => {
                        console.log('Plan changed', plan);
                        try {
                            await AssetService.update(props.systemId, plan);
                        } catch (e) {
                            console.error('Failed to update plan', e);
                        }
                    }}
                    onAssetChange={async (asset) => {
                        console.log('Asset changed', asset);
                        try {
                            await AssetService.update(asset.ref, asset.data);
                        } catch (e) {
                            console.error('Failed to update asset', e);
                        }
                    }}
                    blockAssets={blocks}
                />
            )}
        </SimpleLoader>
    );
};
