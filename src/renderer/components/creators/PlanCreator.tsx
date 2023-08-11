import React, { useState } from 'react';
import { Asset, FileInfo } from '@kapeta/ui-web-types';
import { AssetStore } from '@kapeta/ui-web-context';
import { Button } from '@kapeta/ui-web-components';

import { AssetCreator, AssetCreatorState } from './AssetCreator';
import { PlanForm } from '../forms/PlanForm';
import './PlanCreator.less';
import { Plan } from '@kapeta/schemas';

interface PlanImportProps {
    assetService: AssetStore;
    state: AssetCreatorState;
    onDone: (asset?: Asset) => void;
    skipFiles: string[];
}

const createNewPlan = (): Plan => {
    return {
        kind: 'core/plan',
        metadata: {
            name: '',
        },
        spec: {
            blocks: [],
            connections: [],
        },
    };
};

const selectableHandler = (file: FileInfo) => {
    return file.path.endsWith('/kapeta.yml');
};

export const PlanCreator = (props: PlanImportProps) => {
    return (
        <AssetCreator
            state={props.state}
            title="Create new plan..."
            skipFiles={props.skipFiles}
            createNewKind={createNewPlan}
            fileName="kapeta.yml"
            onDone={props.onDone}
            onCancel={props.onDone}
            fileSelectableHandler={selectableHandler}
            assetService={props.assetService}
            formRenderer={PlanForm}
        />
    );
};
