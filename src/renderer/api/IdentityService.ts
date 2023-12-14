/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { clusterPath } from './ClusterConfig';
import { Identity, MemberIdentity } from '@kapeta/ui-web-types';
import { IdentityStore, simpleFetch } from '@kapeta/ui-web-context';

export type ExtendedIdentity = Identity & {
    email: string;
};

class IdentityServiceImpl implements IdentityStore {
    async getCurrent(): Promise<ExtendedIdentity> {
        return simpleFetch(clusterPath('/identities/current'));
    }

    async getMemberships(identityId: string): Promise<MemberIdentity[]> {
        return simpleFetch(clusterPath(`/identities/${identityId}/memberships`));
    }
}

export const IdentityService = new IdentityServiceImpl();
