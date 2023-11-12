/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import process from 'node:process';
import { userInfo } from 'os';
import { spawnSync } from 'child_process';
import { app } from 'electron';
import Path from 'path';

const args = ['-ilc', 'echo -n "_SHELL_ENV_DELIMITER_"; env; echo -n "_SHELL_ENV_DELIMITER_"; exit'];

const env = {
    // Disables Oh My Zsh auto-update thing that can block the process.
    DISABLE_AUTO_UPDATE: 'true',
};

process.env.KAPETA_HOME = Path.join(app.getPath('home'), '.kapeta');

export const detectDefaultShell = () => {
    const { env } = process;

    if (process.platform === 'win32') {
        return env.COMSPEC || 'cmd.exe';
    }

    try {
        const { shell } = userInfo();
        if (shell) {
            return shell;
        }
    } catch {}

    if (process.platform === 'darwin') {
        return env.SHELL || '/bin/zsh';
    }

    return env.SHELL || '/bin/sh';
};

const defaultShell = detectDefaultShell();

function parseEnv(env: string) {
    env = env.split('_SHELL_ENV_DELIMITER_')[1];
    const returnValue: Record<string, string> = {};

    for (const line of env.split('\n').filter((line) => Boolean(line))) {
        const [key, ...values] = line.split('=');
        returnValue[key] = values.join('=');
    }

    return returnValue;
}

export function shellEnvSync(shell?: string): NodeJS.ProcessEnv {
    if (process.platform === 'win32') {
        return process.env;
    }

    try {
        const { stdout } = spawnSync(shell || defaultShell, args, {
            env: {
                ...process.env,
                ...env,
            },
        });
        return parseEnv(stdout.toString());
    } catch (error) {
        if (shell) {
            throw error;
        } else {
            return process.env;
        }
    }
}

export function shellPathSync() {
    const { PATH } = shellEnvSync();
    return PATH;
}

export function fixPath() {
    if (process.platform === 'win32') {
        return;
    }

    process.env.PATH =
        shellPathSync() ||
        ['./node_modules/.bin', '/.nodebrew/current/bin', '/usr/local/bin', process.env.PATH].join(':');
}

fixPath();
