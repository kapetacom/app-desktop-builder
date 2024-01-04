/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import * as Sentry from '@sentry/electron/main';
import packageJson from '../../package.json';

Sentry.init({
    dsn: 'https://90b96576054385630d501d86133d372c@o4505820837249024.ingest.sentry.io/4505820839018496',
    enabled: process.env.NODE_ENV === 'production',
    release: `v${packageJson.version}`,
    beforeSend(event) {
        // If intercom was involved, don't send the event as it's not actionable
        if (event.exception?.values?.[0]?.stacktrace?.frames?.some((frame) => frame.abs_path?.match(/intercom/i))) {
            return null;
        }

        return event;
    },
});
