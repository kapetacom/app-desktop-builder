import React, { useEffect, useMemo } from 'react';
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
import {
    normalizeKapetaUri,
    useLoadedPlanContext,
} from '../utils/planContextLoader';
import { InstanceInfo } from '../components/plan-editor/types';

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

    const instanceInfos = useAsyncRetry(async () => {
        return (await InstanceService.getInstanceStatusForPlan(
            normalizeKapetaUri(props.systemId)
        )) as InstanceInfo[];
    }, [props.systemId]);

    const instanceStatusMap = useMemo(() => {
        if (!instanceInfos.value) {
            return {};
        }
        const result: Record<string, InstanceStatus> = {};
        instanceInfos.value.forEach((status) => {
            result[status.instanceId] = status.status;
        });
        return result;
    }, [instanceInfos.value]);

    // subscribe and reload instance status
    useEffect(
        () =>
            InstanceService.subscribe(
                normalizeKapetaUri(props.systemId),
                InstanceEventType.EVENT_INSTANCE_CHANGED,
                () => instanceInfos.retry()
            ),
        [instanceInfos, props.systemId]
    );

    const { resourceAssets, blocks, loading, currentlyLoading } =
        useLoadedPlanContext(planData.value?.data);

    let loadingText = 'Loading plan...';

    if (!planData.loading && loading) {
        loadingText = 'Loading plugins...';
        if (currentlyLoading) {
            loadingText = `Loading plugin ${currentlyLoading}...`;
        }
    }

    return (
        <SimpleLoader loading={planData.loading || loading} text={loadingText}>
            {!planData.loading &&
                !loading &&
                planData.value &&
                resourceAssets &&
                blocks && (
                    <PlanEditor
                        plan={planData.value.data}
                        asset={planData.value}
                        resourceAssets={resourceAssets}
                        instanceInfos={instanceInfos.value}
                        instanceStates={instanceStatusMap}
                        mode={plannerMode}
                        systemId={normalizeKapetaUri(props.systemId)}
                        onChange={async (plan) => {
                            try {
                                await AssetService.update(
                                    normalizeKapetaUri(props.systemId),
                                    plan
                                );
                            } catch (e) {
                                console.error('Failed to update plan', e);
                            }
                        }}
                        onAssetChange={async (asset) => {
                            if (!asset.exists) {
                                return;
                            }
                            try {
                                await AssetService.update(
                                    normalizeKapetaUri(asset.ref),
                                    asset.data
                                );
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
