import React, {useState} from 'react';
import {Asset, FileInfo, PLAN_KIND,} from '@blockware/ui-web-types';
import {AssetStore} from '@blockware/ui-web-context';

import {AssetCreator, AssetCreatorState} from './AssetCreator';
import {PlanForm} from "../forms/PlanForm";
import {Button} from "@blockware/ui-web-components";
import './PlanCreator.less';

interface PlanImportProps {
    assetService: AssetStore;
    onDone: (asset?: Asset) => void;
    skipFiles: string[];
}


const createNewPlan = () => {
    return {
        kind: PLAN_KIND,
        metadata: {
            name: '',
        },
        spec: {},
    };
}

const selectableHandler = (file: FileInfo) => {
    return file.path.endsWith('/blockware.yml');
};

export const PlanCreator = (props: PlanImportProps) => {

    const [creatorState, setCreatorState] = useState(AssetCreatorState.CLOSED);

    const openImportPanel = () => {
        setCreatorState(AssetCreatorState.IMPORTING);
    };

    const openCreatePanel = () => {
        setCreatorState(AssetCreatorState.CREATING);
    };

    return (
        <div className={'plan-creator'}>
            <div className="actions">
                <Button
                    text="Create"
                    onClick={openCreatePanel}
                    width={90}
                />
                <Button
                    text="Import"
                    onClick={openImportPanel}
                    width={90}
                />
            </div>
            <AssetCreator
                state={creatorState}
                onStateChanged={setCreatorState}

                title="Create new plan..."
                skipFiles={props.skipFiles}
                introduction=""
                createNewKind={createNewPlan}
                fileName="blockware.yml"
                onDone={props.onDone}
                fileSelectableHandler={selectableHandler}
                assetService={props.assetService}
                formRenderer={PlanForm}
            />
        </div>
    );
}
