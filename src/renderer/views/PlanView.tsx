import React, { useEffect, useMemo } from 'react';
import { useAsyncRetry } from 'react-use';
import { PlannerMode } from '@kapeta/ui-web-plan-editor';
import { InstanceEventType, InstanceStatus } from '@kapeta/ui-web-context';
import { Plan } from '@kapeta/schemas';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { SimpleLoader } from '@kapeta/ui-web-components';
import { AssetService } from 'renderer/api/AssetService';
import { PlanEditor } from '../components/plan-editor/PlanEditor';
import { normalizeKapetaUri, useLoadedPlanContext } from '../utils/planContextLoader';
import { useAsset } from '../hooks/assetHooks';
import { SystemService } from '../api/SystemService';
import './PlanView.less';

interface PlanViewProps {
    systemId: string;
}

export const PlanView = (props: PlanViewProps) => {
    const planData = useAsset<Plan>(props.systemId);

    let plannerMode: PlannerMode = PlannerMode.EDIT;

    const uri = parseKapetaUri(props.systemId);

    if (uri.version !== 'local') {
        // We can only edit local versions
        plannerMode = PlannerMode.CONFIGURATION;
    }

    const instanceInfos = useAsyncRetry(async () => {
        return SystemService.getInstanceStatusForPlan(normalizeKapetaUri(props.systemId));
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
    useEffect(() => {
        return SystemService.subscribe(
            props.systemId,
            InstanceEventType.EVENT_INSTANCE_CHANGED,
            () => !instanceInfos.loading && instanceInfos.retry()
        );
    }, [instanceInfos, props.systemId]);

    const { blocks, loading, currentlyLoading } = useLoadedPlanContext(planData.data?.content);

    let loadingText = 'Loading plan...';

    if (!planData.loading && loading) {
        loadingText = 'Loading plugins...';
        if (currentlyLoading) {
            loadingText = `Loading plugin ${currentlyLoading}...`;
        }
    }

    return (
        <SimpleLoader loading={planData.loading || loading} text={loadingText}>
            {!planData.loading && !loading && planData.data && blocks && (
                <PlanEditor
                    plan={planData.data.content}
                    asset={planData.data}
                    instanceInfos={instanceInfos.value}
                    instanceStates={instanceStatusMap}
                    mode={plannerMode}
                    systemId={normalizeKapetaUri(props.systemId)}
                    onChange={async (plan) => {
                        try {
                            await AssetService.update(normalizeKapetaUri(props.systemId), plan);
                        } catch (e) {
                            console.error('Failed to update plan', e);
                        }
                    }}
                    onAssetChange={async (asset) => {
                        if (!asset.exists) {
                            return;
                        }
                        try {
                            await AssetService.update(normalizeKapetaUri(asset.ref), asset.content);
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
