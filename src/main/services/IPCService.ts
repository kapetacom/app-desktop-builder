import { ipcMain } from 'electron';
import { KapetaAPI } from '@kapeta/nodejs-api-client';

export function attachHandlers() {
    ipcMain.handle('get-token', async () => {
        try {
            const api = new KapetaAPI();
            return await api.getAccessToken();
        } catch (err) {
            // Expected error when user is not logged in
            console.error('Failed to get access token', err);
        }
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

            console.error('Failed to get contexts', err);
        }
    });
}
