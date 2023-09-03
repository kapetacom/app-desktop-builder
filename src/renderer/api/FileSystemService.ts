import * as Path from 'path';

import { FileInfo } from '@kapeta/ui-web-types';
import { clusterPath } from './ClusterConfig';
import { FileSystemStore, simpleFetch } from '@kapeta/ui-web-context';

class FileSystemServiceImpl implements FileSystemStore {
    async createFolder(path: string, folderName: string) {
        const fullPath = Path.join(path, folderName);
        await simpleFetch(clusterPath(`/files/mkdir`, { path: fullPath }), {
            method: 'PUT',
        });
        return true;
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
