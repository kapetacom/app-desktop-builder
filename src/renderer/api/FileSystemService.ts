/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import * as Path from 'path';

import { FileInfo } from '@kapeta/ui-web-types';
import { clusterPath } from './ClusterConfig';
import { FileSystemStore, simpleFetch } from '@kapeta/ui-web-context';
import { showToasty, ToastType } from '@kapeta/ui-web-components';

class FileSystemServiceImpl implements FileSystemStore {
    async createFolder(path: string, folderName: string) {
        const fullPath = Path.join(path, folderName);
        await simpleFetch(clusterPath(`/files/mkdir`, { path: fullPath }), {
            method: 'PUT',
        });
        return true;
    }

    openPath(path: string) {
        window.electron.ipcRenderer.invoke('open-path', path).catch((e) => {
            showToasty({
                title: 'Failed to open path',
                message: (e as Error).message,
                type: ToastType.DANGER,
            });
        });
    }

    async getHomeFolder(): Promise<string> {
        return simpleFetch(clusterPath(`/files/root`));
    }

    async getProjectFolder(): Promise<string> {
        return simpleFetch(clusterPath(`/files/project/root`));
    }

    async setProjectFolder(folder: string): Promise<string> {
        return simpleFetch(clusterPath(`/files/project/root`), {
            headers: {
                'Content-Type': 'text/plain',
            },
            body: folder,
            method: 'POST',
        });
    }

    async getEditor(): Promise<string> {
        return simpleFetch(clusterPath(`/files/editor`));
    }

    async setEditor(folder: string): Promise<string> {
        return simpleFetch(clusterPath(`/files/editor`), {
            headers: {
                'Content-Type': 'text/plain',
            },
            body: folder,
            method: 'POST',
        });
    }

    async listFilesInFolder(path: string): Promise<FileInfo[]> {
        return simpleFetch(clusterPath(`/files/list`, { path }));
    }

    async readFile(path: string): Promise<string> {
        return simpleFetch(clusterPath(`/files/readfile`, { path }));
    }

    async writeFile(path: string, content: string): Promise<void> {
        await simpleFetch(clusterPath(`/files/writefile`, { path }), {
            headers: {
                'Content-Type': 'application/yaml',
            },
            body: content,
            method: 'POST',
        });
    }
}

export const FileSystemService = new FileSystemServiceImpl();
