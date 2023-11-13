/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

/**
 * This module executes inside of electron's main process and
 * will monkey patch the spawn and Path functions to handle asar.unpacked
 * correctly when running binaries from the asar archive.
 */
import 'hazardous'; // Will monkey patch Path to handle asar.unpacked correctly
import childProcess from 'child_process';
import Path from 'path';

const oldSpawn = childProcess.spawn;

// @ts-ignore
childProcess.spawn = function (command: string, args?: string[], options?: any) {
    if (options && options.cwd) {
        // Also resolve cwd if provided - this is needed for the asar patch to work
        options.cwd = Path.resolve(options.cwd);
    }
    return oldSpawn(command, args, options);
};
