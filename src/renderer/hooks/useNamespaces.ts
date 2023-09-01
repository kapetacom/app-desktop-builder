import { useKapetaContext } from './contextHook';
import { useMemo } from 'react';
import { useFormContextField } from '@kapeta/ui-web-components';

export const LOCAL_NAMESPACE = 'local';

export const useNamespaces = (fieldName: string) => {
    const context = useKapetaContext();
    const formField = useFormContextField(fieldName);
    return useMemo(() => {
        const identity = context.profile;
        const fromValue: string[] = [];
        if (formField.get() && formField.get().includes('/')) {
            const existingHandle = formField.get().split('/')[0];
            if (existingHandle !== LOCAL_NAMESPACE && existingHandle && !fromValue.includes(existingHandle)) {
                fromValue.push(existingHandle);
            }
        }

        if (!identity) {
            return [...fromValue, LOCAL_NAMESPACE];
        }

        const memberships = context.contexts?.memberships ?? [];
        return [...fromValue, identity.handle, ...memberships.map((membership) => membership.identity.handle), 'local'];
    }, [context.profile, context.contexts?.memberships, formField]);
};
