import React from 'react';
import {
    Asset,
    EntityConfigProps,
    FileInfo,
    PLAN_KIND,
} from '@blockware/ui-web-types';
import { AssetStore } from '@blockware/ui-web-context';
import { FormInput } from '@blockware/ui-web-components';

import { AssetImport } from '../../plan-import/AssetImport';

interface PlanImportProps {
    assetService: AssetStore;
    onDone: (asset?: Asset) => void;
    skipFiles: string[];
}

const PlanForm = (props: EntityConfigProps) => {
    function updateValue(fieldName: string, value: string) {
        const newMetadata = { ...props.metadata };
        newMetadata[fieldName] = value;
        props.onDataChanged(newMetadata, props.spec);
    }

    return (
        <>
            <FormInput
                name={'name'}
                value={props.metadata.name}
                label={'Name'}
                validation={['required']}
                help={
                    'Give your plan an identifier with your handle. E.g. myhandle/my-plan'
                }
                onChange={updateValue}
            />

            <FormInput
                name={'title'}
                value={props.metadata.title}
                label={'Title'}
                validation={['required']}
                help={
                    'Give your plan a user friendly title - e.g. My Awesome Plan'
                }
                onChange={updateValue}
            />
        </>
    );
};

class PlanImport extends React.Component<PlanImportProps> {
    private createNewPlan() {
        return {
            kind: PLAN_KIND,
            metadata: {
                name: '',
            },
            spec: {},
        };
    }

    private selectableHandler = (file: FileInfo) => {
        return file.path.endsWith('/blockware.yml');
    };

    render() {
        return (
            <AssetImport
                title={'Create new plan...'}
                skipFiles={this.props.skipFiles}
                introduction={''}
                createNewKind={this.createNewPlan}
                fileName={'blockware.yml'}
                onDone={this.props.onDone}
                fileSelectableHandler={this.selectableHandler}
                assetService={this.props.assetService}
                formRenderer={PlanForm}
            />
        );
    }
}

export default PlanImport;
