import process from 'node:process';
import { userInfo } from 'os';
import { spawnSync } from 'child_process';

const args = ['-ilc', 'echo -n "_SHELL_ENV_DELIMITER_"; env; echo -n "_SHELL_ENV_DELIMITER_"; exit'];

const spawnEnv = {
    // Disables Oh My Zsh auto-update thing that can block the process.
    DISABLE_AUTO_UPDATE: 'true',
};

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
    } catch {
        // Ignore
    }

    if (process.platform === 'darwin') {
        return env.SHELL || '/bin/zsh';
    }

    return env.SHELL || '/bin/sh';
};

const defaultShell = detectDefaultShell();

function parseEnv(envString: string) {
    const cleanEnv = envString.split('_SHELL_ENV_DELIMITER_')[1];
    const returnValue = {};

    // eslint-disable-next-line no-restricted-syntax
    for (const line of cleanEnv.split('\n').filter((lineI) => Boolean(lineI))) {
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
                ...spawnEnv,
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
