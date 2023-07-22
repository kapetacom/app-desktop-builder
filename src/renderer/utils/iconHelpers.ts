import {IconType,  IconValue} from "@kapeta/schemas";
import {uploadAttachment} from "../api/AttachmentService";
import {SchemaKind} from "@kapeta/ui-web-types";


export const replaceBase64IconWithUrl = async (blockData: SchemaKind) => {
    if (!blockData.spec.icon) {
        return;
    }

    const icon = blockData.spec.icon as IconValue;

    if (icon.value && icon.type === IconType.URL) {
        if (icon.value.startsWith('data:')) {
            // We want to upload the icon to the server and use the url instead
            const dataUrl = icon.value;
            const [metadata,base64Data] = dataUrl.split(',');
            const mimeType = metadata.split(';')[0].split(':')[1];
            const data = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const [handle, name] = blockData.metadata.name.split('/');
            console.log('upload mimeType', mimeType, handle, name, data.length);

            const result = await uploadAttachment(handle, name, {
                type: 'icon',
                mimeType,
                data
            });

            // Add a cache buster since we might be overwriting an existing icon
            if (result.url.includes('?')) {
                result.url += '&v=' + Date.now();
            } else {
                result.url += '?v=' + Date.now();
            }

            icon.value = result.url;
        }
    }
}
