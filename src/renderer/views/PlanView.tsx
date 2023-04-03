import React, { useEffect, useState } from 'react';
import {
    Planner2,
    PlannerMode,
    PlannerModelReader,
    PlannerModelWrapper,
} from '@kapeta/ui-web-plan-editor';

import { AssetService, BlockService } from '@kapeta/ui-web-context';

import './PlanView.less';
import { Asset, PlanKind } from '@kapeta/ui-web-types';
import { SimpleLoader } from '@kapeta/ui-web-components';
import { toClass } from '@kapeta/ui-web-utils';
import { useAsync } from 'react-use';
import { PlanEditor } from './PlanEditor';

function getVersionFromRef(ref: string) {
    let refWithoutProtocol = ref;
    if (refWithoutProtocol.indexOf('://') > -1) {
        refWithoutProtocol = refWithoutProtocol.split('://')[1];
    }

    const [, version] = refWithoutProtocol.split(':');
    return version;
}

interface PlanViewProps {
    planRef: string;
}

export const PlanView = (props: PlanViewProps) => {
    console.log('PlanView render');
    const reader: PlannerModelReader = new PlannerModelReader(BlockService);
    const version = getVersionFromRef(props.planRef);

    const planData = useAsync(async () => {
        const planAsset: Asset<PlanKind> = await AssetService.get(
            props.planRef
        );

        // avoid regeneratorruntime by using Promise.all instead of for await
        await Promise.all(
            (planAsset.data.spec.blocks || []).map((block) =>
                BlockService.get(block.block.ref)
            )
        ).catch((e) => {
            console.error(e);
        });

        return {
            planAsset,
            blockAssets: (await BlockService.list()) || [],
        };
    });

    const isReadOnly = planData.value?.planAsset.ref.endsWith(':local');
    const containerClass = toClass({
        'plan-view': true,
        'read-only': isReadOnly || false,
    });

    return (
        <SimpleLoader loading={planData.loading} text="Loading plan...">
            {planData.value?.planAsset && planData.value.blockAssets && (
                <div className={containerClass}>
                    {/*<TopMenu*/}
                    {/*    plan={model}*/}
                    {/*    version={version}*/}
                    {/*    systemId={props.planRef}*/}
                    {/*/>*/}
                    <div className="planner">
                        <PlanEditor
                            plan={planData.value.planAsset.data}
                            blockAssets={planData.value.blockAssets}
                            systemId={props.planRef}
                            enableInstanceListening
                        />
                    </div>
                </div>
            )}
        </SimpleLoader>
    );
};
