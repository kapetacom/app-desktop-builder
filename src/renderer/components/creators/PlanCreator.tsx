import React from 'react';
import {FileInfo, SchemaKind} from '@kapeta/ui-web-types';
import { AssetStore } from '@kapeta/ui-web-context';

import { AssetCreator, AssetCreatorState } from './AssetCreator';
import { PlanForm } from '../forms/PlanForm';
import './PlanCreator.less';
import { Plan } from '@kapeta/schemas';
import {AssetInfo} from "@kapeta/ui-web-plan-editor";

interface PlanImportProps {
    assetService: AssetStore;
    state: AssetCreatorState;
    onDone: (asset?: AssetInfo<Plan>) => void;
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
