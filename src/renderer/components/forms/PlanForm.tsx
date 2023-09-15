import { AssetNameInput, FormField } from '@kapeta/ui-web-components';
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
                readOnly={props.readOnly}
                namespaces={namespaces}
                defaultValue={context.activeContext?.identity?.handle ?? 'local'}
                help="Give your plan an identifier with your handle. E.g. myhandle/my-plan"
            />

            <FormField
                name="metadata.title"
                label="Title"
                readOnly={props.readOnly}
                validation={['required']}
                help="Give your plan a user friendly title - e.g. My Awesome Plan"
            />
        </>
    );
};
