export function getToken(): Promise<string> {
    return window.electron.ipcRenderer.invoke('get-token');
}
