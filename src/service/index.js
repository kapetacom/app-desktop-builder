/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

const { default: LocalClusterService } = require('@kapeta/local-cluster-service');

(async () => {
    await LocalClusterService.start();
})().catch((err) => {
    process.stderr.end(err.stack);
    process.exitCode = 1;
});
