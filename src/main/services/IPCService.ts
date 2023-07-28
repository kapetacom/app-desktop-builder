import { ipcMain } from 'electron';
import { KapetaAPI } from '@kapeta/nodejs-api-client';

export function attachHandlers() {
    ipcMain.handle('get-token', async () => {
        const api = new KapetaAPI();
        const token = await api.getAccessToken();
        return token;
    });

    //
    ipcMain.handle('get-contexts', async () => {
        try {
            const api = new KapetaAPI();
            const identity = await api.getCurrentIdentity();
            const context = await api.getCurrentContext();
            const memberships = await api.getCurrentMemberships();

            return {
                memberships: [{ identity }, ...memberships],
                current: context?.identity.handle || identity.handle,
            };
        } catch (err) {
            // Expected error when user is not logged in
            if (err?.message?.includes('No current identity')) {
                return {
                    memberships: [],
                    current: '',
                };
            }
            throw err;
        }
    });
}
