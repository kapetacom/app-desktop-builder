import * as Sentry from '@sentry/electron/main';
import packageJson from '../../package.json';

Sentry.init({
    dsn: 'https://90b96576054385630d501d86133d372c@o4505820837249024.ingest.sentry.io/4505820839018496',
    enabled: process.env.NODE_ENV === 'production',
    release: packageJson.version,
});
