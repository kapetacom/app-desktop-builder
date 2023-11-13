/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { IFoundEditor } from '@kapeta/electron-ide-opener';

export interface SettingsInformation {
    editors: IFoundEditor<string>[];
    defaultEditor: IFoundEditor<string> | null;
}
