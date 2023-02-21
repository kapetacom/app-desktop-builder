import React, { useEffect, useState } from 'react';
import {
    Planner,
    PlannerMode,
    PlannerModelReader,
    PlannerModelWrapper,
} from '@blockware/ui-web-plan-editor';
import { Lambda, reaction } from 'mobx';
import _ from 'lodash';

import {
    AssetService,
    BlockService,
    InstanceService,
} from '@blockware/ui-web-context';

import BlockStore from '../components/blocks/store/BlockStore';

import './PlanView.less';
import { Asset } from '@blockware/ui-web-types';
import { SimpleLoader } from '@blockware/ui-web-components';
import { TopMenu } from '../components/TopMenu';
import { toClass } from '@blockware/ui-web-utils';

function getVersionFromRef(ref: string) {
    if (ref.indexOf('://') > -1) {
        ref = ref.split('://')[1];
    }

    const [, version] = ref.split(':');
    return version;
}

interface PlanViewProps {
    planRef: string;
}

export const PlanView = (props: PlanViewProps) => {
    const reader: PlannerModelReader = new PlannerModelReader(BlockService);
    let planModelObserver: Lambda | undefined = undefined;

    function cleanupObserver() {
        if (planModelObserver) {
            planModelObserver();
            planModelObserver = undefined;
        }
    }
    const [asset, setAsset] = useState<Asset>();
    const [model, setModal] = useState<PlannerModelWrapper>();
    const version = getVersionFromRef(props.planRef);

    const loader = async () => {
        const assetData = await AssetService.get(props.planRef);
        const modelData = await reader.load(assetData.data, props.planRef);

        if (!version || version.toLowerCase() !== 'local') {
            //We can only edit local versions
            modelData.setMode(PlannerMode.CONFIGURATION);
        }

        cleanupObserver();
        planModelObserver = reaction(
            () => modelData,
            _.debounce(async () => {
                await AssetService.update(props.planRef, modelData.getData());
            }, 1000)
        );

        setAsset(assetData);
        setModal(modelData);
    };

    useEffect(() => {
        return cleanupObserver;
    }, []);

    const containerClass = toClass({
        'plan-view': true,
        'read-only': model?.isReadOnly() || false,
    });

    return (
        <SimpleLoader loader={loader} text={'Loading plan...'}>
            {model && asset && (
                <div className={containerClass}>
                    <TopMenu
                        plan={model}
                        version={version}
                        systemId={props.planRef}
                    />
                    <div className={'planner'}>
                        <Planner
                            plan={model}
                            systemId={props.planRef}
                            blockStore={BlockStore}
                            enableInstanceListening={true}
                        />
                    </div>
                </div>
            )}
        </SimpleLoader>
    );
};
