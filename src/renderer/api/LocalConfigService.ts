/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { simpleFetch } from '@kapeta/ui-web-context';
import { clusterPath } from './ClusterConfig';

const HEADER_INSTANCE = 'X-Kapeta-Instance';
const HEADER_SYSTEM = 'X-Kapeta-System';

export type ConfigData = { [key: string]: any };

export const getInstanceConfigs = async (systemId: string): Promise<ConfigData> => {
    const url = clusterPath(`/config/instance`);

    return simpleFetch(url, {
        method: 'GET',
        headers: {
            [HEADER_SYSTEM]: systemId,
        },
    });
};

export const getInstanceConfig = async (systemId: string, instanceId: string): Promise<ConfigData> => {
    const url = clusterPath(`/config/instance`);

    return simpleFetch(url, {
        method: 'GET',
        headers: {
            [HEADER_INSTANCE]: instanceId,
            [HEADER_SYSTEM]: systemId,
        },
    });
};

export const setInstanceConfig = async (systemId: string, instanceId: string, data: ConfigData) => {
    const url = clusterPath(`/config/instance`);

    return simpleFetch(url, {
        method: 'PUT',
        headers: {
            [HEADER_INSTANCE]: instanceId,
            [HEADER_SYSTEM]: systemId,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
};

export const getPlanConfig = async (systemId: string): Promise<ConfigData> => {
    const url = clusterPath(`/config/system`);

    return simpleFetch(url, {
        method: 'GET',
        headers: {
            [HEADER_SYSTEM]: systemId,
        },
    });
};

export const setPlanConfig = async (systemId: string, data: ConfigData) => {
    const url = clusterPath(`/config/system`);

    return simpleFetch(url, {
        method: 'PUT',
        headers: {
            [HEADER_SYSTEM]: systemId,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
};
