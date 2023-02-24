import React, { useCallback } from 'react';
import {
    Asset,
    EntityConfigProps,
    FileInfo,
    PLAN_KIND,
} from '@blockware/ui-web-types';
import { AssetStore, IdentityService } from '@blockware/ui-web-context';
import {
    FormInput,
    AssetNameInput,
    SimpleLoader,
    useFormContextField,
} from '@blockware/ui-web-components';
import { useAsync } from 'react-use';

import { AssetImport } from '../../plan-import/AssetImport';

interface PlanImportProps {
    assetService: AssetStore;
    onDone: (asset?: Asset) => void;
    skipFiles: string[];
}

const PlanForm = (props: EntityConfigProps) => {
    const titleField = useFormContextField('metadata.title');
    const updateValue = useCallback(
        (fieldName: string, value: string) => {
            titleField.set(value);
        },
        [titleField]
    );

    const { value: namespaces, loading } = useAsync(async () => {
        const identity = await IdentityService.getCurrent();
        const memberships = await IdentityService.getMemberships(identity.id);
        return [
            identity.handle,
            ...memberships.map((membership) => membership.identity.handle),
        ];
    });

    return (
        <>
            <SimpleLoader loading={loading}>
                <AssetNameInput
                    name="metadata.name"
                    label="Name"
                    help="Give your plan an identifier with your handle. E.g. myhandle/my-plan"
                    namespaces={namespaces || []}
                />
            </SimpleLoader>

            <FormInput
                name="metadata.title"
                value={titleField.get('')}
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
