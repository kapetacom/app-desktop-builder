/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { useAsync } from 'react-use';

export function getToken(): Promise<string> {
    return window.electron.ipcRenderer.invoke('get-token');
}

export function useAuthToken() {
    return useAsync(() => getToken());
}
