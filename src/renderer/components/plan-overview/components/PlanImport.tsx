import React, { useCallback } from 'react';
import {
    Asset,
    FileInfo,
    PLAN_KIND,
} from '@blockware/ui-web-types';
import { AssetStore, IdentityService } from '@blockware/ui-web-context';
import {
    FormField,
    AssetNameInput,
    SimpleLoader,
    useFormContextField,
} from '@blockware/ui-web-components';
import { useAsync } from 'react-use';



import {AssetImport} from '../../plan-import/AssetImport';

interface PlanImportProps {
    assetService: AssetStore;
    onDone: (asset?: Asset) => void;
    skipFiles: string[];
}


const PlanForm = () => {

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

            <FormField
                name="metadata.name"
                label="Name"
                validation={['required']}
                help="Give your plan an identifier with your handle. E.g. myhandle/my-plan"
            />

            <FormField
                name="metadata.title"
                label="Title"
                validation={['required']}
                help="Give your plan a user friendly title - e.g. My Awesome Plan"
            />

        </>
    );
};

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

export const PlanImport = (props:PlanImportProps) => {

    return (
        <AssetImport
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
    );
}
