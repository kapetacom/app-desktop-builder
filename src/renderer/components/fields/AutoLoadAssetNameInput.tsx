// Higher-order-component to allow us to use hooks for data loading (not possible in class components)
import { useAsync } from 'react-use';
import { IdentityService } from '@kapeta/ui-web-context';
import { AssetNameInput, SimpleLoader } from '@kapeta/ui-web-components';
import React from 'react';

interface Props {
    name: string;
    label: string;
    help: string;
}

export const AutoLoadAssetNameInput = (props: Props) => {
    const { value: cloudNamespaces, loading } = useAsync(async () => {
        try {
            const identity = await IdentityService.getCurrent();
            const memberships = await IdentityService.getMemberships(
                identity.id
            );
            const namespaces = [
                identity.handle,
                ...memberships.map((membership) => membership.identity.handle),
                'local',
            ];
            localStorage.setItem(
                'kapeta.namespaces',
                JSON.stringify(namespaces)
            );
            return namespaces;
        } catch (e) {
            // This is only doable if we reserve the name
            return ['local'];
        }
    });

    const cachedValue = (() => {
        try {
            return JSON.parse(
                localStorage.getItem('kapeta.namespaces') || '[]'
            ) as string[];
        } catch (e) {
            return [];
        }
    })();
    const namespaces = cloudNamespaces || cachedValue;

    return (
        <SimpleLoader loading={loading && !namespaces.length}>
            <AssetNameInput {...props} namespaces={namespaces || []} />
        </SimpleLoader>
    );
};
