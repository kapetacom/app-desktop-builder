/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { AssetNameInput, FormField, FormFieldType } from '@kapeta/ui-web-components';
import React from 'react';
import { useKapetaContext } from '../../hooks/contextHook';
import { useNamespacesForField } from '../../hooks/useNamespacesForField';
import { CreatingFormProps } from '../creators/AssetCreator';

interface Props extends CreatingFormProps {
    readOnly?: boolean;
}

export const PlanForm = (props: Props) => {
    const context = useKapetaContext();
    const namespaces = useNamespacesForField('metadata.name');

    return (
        <>
            <AssetNameInput
                name="metadata.name"
                label="Name"
                validation={['required']}
                readOnly={props.readOnly}
                namespaces={namespaces}
                defaultValue={context.activeContext?.identity?.handle ?? 'local'}
                help={'Give your plan an identifier with your handle. E.g. myhandle/my-plan'}
            />

            <FormField
                name="metadata.visibility"
                type={FormFieldType.ENUM}
                validation={['required']}
                options={{
                    public: 'Public',
                    private: 'Private',
                }}
                label="Visiblity"
                help="Determine if your Plan is available on Block Hub, The Kapeta Market Place"
            />

            <FormField
                name="metadata.title"
                label="Title"
                readOnly={props.readOnly}
                validation={['required']}
                help="Give your plan a user friendly title - e.g. My Awesome Plan"
            />

            <FormField
                name="metadata.description"
                type={FormFieldType.TEXT}
                label="Description"
                help="Give your block a longer description"
            />
        </>
    );
};
