import React from 'react';
import './PlanOverviewTopBar.less';
import { AssetService } from '@kapeta/ui-web-context';
import { Asset } from '@kapeta/ui-web-types';
import { PlanCreator } from '../creators/PlanCreator';

interface Props {
    skipFiles: string[];
    onDone: (asset?: Asset) => void;
}

export function PlanOverviewTopBar(props: Props) {
    return (
        <div className="plan-overview-top-bar">
            <PlanCreator
                skipFiles={props.skipFiles}
                assetService={AssetService}
                onDone={(asset?: Asset) => {
                    props.onDone(asset);
                }}
            />
        </div>
    );
}
