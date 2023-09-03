import { simpleFetch } from '@kapeta/ui-web-context';
import { clusterPath } from './ClusterConfig';

export interface AttachmentInfo {
    type: string;
    mimeType: string;
    data: Uint8Array;
}

export interface UploadResult {
    url: string;
}

export const uploadAttachment = async (
    handle: string,
    name: string,
    attachment: AttachmentInfo
): Promise<UploadResult> => {
    const url = clusterPath(`/attachments/${encodeURIComponent(handle)}/${encodeURIComponent(name)}`);

    return simpleFetch(url, {
        method: 'PUT',
        headers: {
            'content-type': attachment.mimeType,
            'content-length': attachment.data.length + '',
            'content-disposition': attachment.type,
        },
        body: attachment.data,
    });
};
