/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

export function parseVersion(a: string) {
    if (a === 'local') {
        return [a];
    }
    return a.split('.').map((v) => parseInt(v, 10));
}

export function versionIsBigger(a: string, b: string) {
    if (a === 'local' && b === 'local') {
        return false;
    }

    if (a === 'local' && b !== 'local') {
        return false;
    }

    if (a !== 'local' && b === 'local') {
        return true;
    }

    const aVersion = parseVersion(a);
    const bVersion = parseVersion(b);

    for (let i = 0; i < aVersion.length; i++) {
        if (aVersion[i] > bVersion[i]) {
            return true;
        }
        if (aVersion[i] < bVersion[i]) {
            return false;
        }
    }

    return false;
}
