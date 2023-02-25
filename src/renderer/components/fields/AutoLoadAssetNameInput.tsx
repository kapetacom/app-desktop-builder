// Higher-order-component to allow us to use hooks for data loading (not possible in class components)
import { useAsync } from 'react-use';
import { IdentityService } from '@blockware/ui-web-context';
import { AssetNameInput, SimpleLoader } from '@blockware/ui-web-components';
import React from 'react';

interface Props {
    name: string;
    label: string;
    help: string;
}

export const AutoLoadAssetNameInput = (props: Props) => {
    const { value: namespaces, loading } = useAsync(async () => {
        const identity = await IdentityService.getCurrent();
        const memberships = await IdentityService.getMemberships(identity.id);
        return [
            identity.handle,
            ...memberships.map((membership) => membership.identity.handle),
        ];
    });
    return (
        <SimpleLoader loading={loading}>
            <AssetNameInput {...props} namespaces={namespaces || []} />
        </SimpleLoader>
    );
};
