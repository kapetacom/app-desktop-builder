import { Asset, SchemaKind } from '@kapeta/ui-web-types';

export function ProviderHeaderIcon() {
    return (
        <svg
            width="24"
            height="15"
            viewBox="0 0 24 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect
                x="8.33325"
                width="6.66667"
                height="6.66667"
                fill="#F9DFDD"
                fillOpacity="0.87"
            />
            <rect width="6.66667" height="6.66667" fill="#F9DFDD" />
            <rect
                x="8.33325"
                y="8.33333"
                width="6.66667"
                height="6.66667"
                fill="#F9DFDD"
                fillOpacity="0.75"
            />
            <rect
                x="16.6667"
                y="8.33333"
                width="6.66667"
                height="6.66667"
                fill="#F9DFDD"
                fillOpacity="0.6"
            />
        </svg>
    );
}

export function ConsumerHeaderIcon() {
    return (
        <svg
            width="24"
            height="15"
            viewBox="0 0 24 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect
                width="6.66667"
                height="6.66667"
                transform="matrix(1 8.74228e-08 8.74228e-08 -1 8.3335 15)"
                fill="#F9DFDD"
                fillOpacity="0.87"
            />
            <rect
                width="6.66667"
                height="6.66667"
                transform="matrix(1 8.74228e-08 8.74228e-08 -1 0.000244141 15)"
                fill="#F9DFDD"
            />
            <rect
                width="6.66667"
                height="6.66667"
                transform="matrix(1 8.74228e-08 8.74228e-08 -1 8.3335 6.66667)"
                fill="#F9DFDD"
                fillOpacity="0.75"
            />
            <rect
                width="6.66667"
                height="6.66667"
                transform="matrix(1 8.74228e-08 8.74228e-08 -1 16.667 6.66667)"
                fill="#F9DFDD"
                fillOpacity="0.6"
            />
        </svg>
    );
}

export function getAssetTitle(asset: Asset): string {
    return getSchemaTitle(asset.data);
}

export function getSchemaTitle(asset: SchemaKind): string {
    return asset.metadata.title ?? asset.metadata.name;
}
