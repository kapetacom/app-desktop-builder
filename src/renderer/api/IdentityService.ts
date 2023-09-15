import { Identity, MemberIdentity } from '@kapeta/ui-web-types';
import { IdentityStore, simpleFetch } from '@kapeta/ui-web-context';
import { clusterPath } from './ClusterConfig';

class IdentityServiceImpl implements IdentityStore {
    async getCurrent(): Promise<Identity> {
        return simpleFetch(clusterPath('/identities/current'));
    }

    async getMemberships(identityId: string): Promise<MemberIdentity[]> {
        return simpleFetch(clusterPath(`/identities/${identityId}/memberships`));
    }
}

export const IdentityService = new IdentityServiceImpl();
