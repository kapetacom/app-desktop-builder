import React, { useCallback } from 'react';
import {
    Asset,
    EntityConfigProps,
    FileInfo,
    PLAN_KIND,
} from '@blockware/ui-web-types';
import { AssetStore, IdentityService } from '@blockware/ui-web-context';
import { FormInput, AssetNameInput } from '@blockware/ui-web-components';
import { useAsync } from 'react-use';

import { AssetImport } from '../../plan-import/AssetImport';

interface PlanImportProps {
    assetService: AssetStore;
    onDone: (asset?: Asset) => void;
    skipFiles: string[];
}

const PlanForm = (props: EntityConfigProps) => {
    const updateValue = useCallback(
        (fieldName: string, value: string) => {
            const newMetadata = { ...props.metadata };
            newMetadata[fieldName] = value;
            props.onDataChanged(newMetadata, props.spec);
        },
        [props]
    );

    const { value: namespaces } = useAsync(async () => {
        const identity = await IdentityService.getCurrent();
        const memberships = await IdentityService.getMemberships(identity.id);
        return [
            identity.handle,
            ...memberships.map((membership) => membership.identity.handle),
        ];
    });

    return (
        <>
            <AssetNameInput
                name="name"
                value={props.metadata.name}
                label="Name"
                help="Give your plan an identifier with your handle. E.g. myhandle/my-plan"
                onChange={updateValue}
                namespaces={namespaces || []}
            />

            <FormInput
                name="title"
                value={props.metadata.title}
                label="Title"
                validation={['required']}
                help="Give your plan a user friendly title - e.g. My Awesome Plan"
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
                title="Create new plan..."
                skipFiles={this.props.skipFiles}
                introduction=""
                createNewKind={this.createNewPlan}
                fileName="blockware.yml"
                onDone={this.props.onDone}
                fileSelectableHandler={this.selectableHandler}
                assetService={this.props.assetService}
                formRenderer={PlanForm}
            />
        );
    }
}

export default PlanImport;
