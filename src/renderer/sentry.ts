/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { init } from '@sentry/electron/renderer';
import { init as reactInit } from '@sentry/react';

init(
    {
        dsn: 'https://90b96576054385630d501d86133d372c@o4505820837249024.ingest.sentry.io/4505820839018496',
        enabled: process.env.NODE_ENV === 'production',
        release: process.env.RELEASE_VERSION,
    },
    // @ts-ignore
    reactInit
);
