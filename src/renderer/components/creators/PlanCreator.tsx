/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { FileInfo } from '@kapeta/ui-web-types';
import { AssetStore } from '@kapeta/ui-web-context';

import { AssetCreator, AssetCreatorState } from './AssetCreator';
import { PlanForm } from '../forms/PlanForm';
import { Plan } from '@kapeta/schemas';
import { AssetInfo } from '@kapeta/ui-web-plan-editor';
import './PlanCreator.less';

interface PlanImportProps {
    assetService: AssetStore;
    state: AssetCreatorState;
    onDone: (asset?: AssetInfo<Plan>) => void;
    skipFiles: string[];
    inline?: boolean;
    handle?: string;
}

const createNewPlan = (handle?: string): Plan => {
    return {
        kind: 'core/plan',
        metadata: {
            name: handle ? `${handle}/` : '',
            visibility: 'private',
            description: '',
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
            createNewKind={() => createNewPlan(props.handle)}
            fileName="kapeta.yml"
            onDone={props.onDone}
            onCancel={props.onDone}
            fileSelectableHandler={selectableHandler}
            assetService={props.assetService}
            formRenderer={PlanForm}
            inline={props.inline}
        />
    );
};
