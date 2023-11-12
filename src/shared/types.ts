import type { IFoundEditor } from '@kapeta/electron-ide-opener';

export interface SettingsInformation {
    editors: IFoundEditor<string>[];
    defaultEditor: IFoundEditor<string> | null;
}
