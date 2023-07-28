import { ipcMain } from 'electron';
import { KapetaAPI } from '@kapeta/nodejs-api-client';

export function attachHandlers() {
    ipcMain.handle('get-token', async () => {
        const api = new KapetaAPI();
        const token = await api.getAccessToken();
        return token;
    });
}
