import { FormField } from '@kapeta/ui-web-components';
import React from 'react';
import { AutoLoadAssetNameInput } from '../fields/AutoLoadAssetNameInput';

export const PlanForm = () => {
    return (
        <>
            <AutoLoadAssetNameInput
                name="metadata.name"
                label="Name"
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
