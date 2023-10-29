/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { useKapetaContext } from './contextHook';
import { useMemo } from 'react';
import { useFormContextField } from '@kapeta/ui-web-components';

export const useNamespacesForField = (fieldName: string) => {
    const context = useKapetaContext();
    const formField = useFormContextField(fieldName);
    return useMemo(() => {
        const identity = context.profile;
        const fromValue: string[] = [];
        if (formField.get() && formField.get().includes('/')) {
            const existingHandle = formField.get().split('/')[0];
            if (existingHandle && !fromValue.includes(existingHandle)) {
                fromValue.push(existingHandle);
            }
        }

        if (!identity) {
            return [...fromValue];
        }

        const memberships = context.contexts?.memberships ?? [];
        const out = new Set([
            ...fromValue,
            identity.handle,
            ...memberships.map((membership) => membership.identity.handle),
        ]);
        return Array.from(out);
    }, [context.profile, context.contexts?.memberships, formField]);
};
