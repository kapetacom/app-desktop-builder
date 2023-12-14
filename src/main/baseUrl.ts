/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { KapetaAPI } from '@kapeta/nodejs-api-client';

// Load the Kapeta API
const kapetaApi = new KapetaAPI();

export const getUrl = (prefix: string) => {
    const url = new URL(kapetaApi.getBaseUrl());
    url.host = [prefix, ...url.host.split('.').slice(1)].join('.');
    return url.toString();
};

export const getEnv = () => {
    return getUrl('app').includes('.staging.') ? 'staging' : 'production';
};
