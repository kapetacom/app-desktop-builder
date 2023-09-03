let baseUrl;

if (typeof window !== 'undefined' &&
    window['KapetaDesktop']?.cluster_service?.url) {
    //We're inside the desktop app
    baseUrl = window['KapetaDesktop']?.cluster_service?.url
} else if (typeof process !== 'undefined' && process.env) {
    //We're inside Node
    baseUrl = process.env.REACT_APP_CLUSTER_SERVICE;
} else if (
    typeof window !== 'undefined' &&
    window['Kapeta'] &&
    window['Kapeta']['config'] &&
    window['Kapeta']['config'].cluster_service
) {
    //We're inside a browser
    baseUrl = window['Kapeta']['config'].cluster_service;
}

export const CLUSTER_SERVICE_BASEURL = baseUrl ? baseUrl : 'http://localhost:35100';

export function clusterPath(path: string, query?: { [key: string]: string }) {
    if (!path.startsWith('/')) {
        path = '/' + path;
    }

    let base = CLUSTER_SERVICE_BASEURL;
    if (base.endsWith('/')) {
        base = base.substring(0, base.length - 1);
    }

    let url = base + path;

    if (query) {
        url += '?' + new URLSearchParams(query).toString();
    }

    return url;
}

export function socketPath() {
    return CLUSTER_SERVICE_BASEURL;
}
