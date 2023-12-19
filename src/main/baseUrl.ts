/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import clusterConfig from '@kapeta/local-cluster-config';

export const getUrl = (service: string) => {
    const envPrefix = clusterConfig.getEnvironment() === 'staging' ? 'staging' : '';
    return clusterConfig.getRemoteService(
        service,
        [`https://${service}`, envPrefix, 'kapeta.com'].filter(Boolean).join('.')
    );
};
