type FileFilter = Electron.FileFilter;
type OpenDialogOptions = Electron.OpenDialogOptions;

interface Options {
    title?: string;
    multiSelections?: boolean;
    filters?: FileFilter[];
    defaultPath?: string;
    selectDirectory?: boolean;
}

export const showFilePickerOne = async (
    options: Omit<Options, 'multiSelection'>
): Promise<string | null> => {
    return (await showFilePicker(options)) as string | null;
};

export const showFilePickerMulti = async (
    options: Omit<Options, 'multiSelection'>
): Promise<string[] | null> => {
    return (await showFilePicker({
        ...options,
        multiSelections: true,
    })) as string[] | null;
};
export const showFilePicker = async (options: Options) => {
    const properties: OpenDialogOptions['properties'] = ['createDirectory'];
    if (options.selectDirectory) {
        properties.push('openDirectory');
    } else {
        properties.push('openFile');
    }
    if (options.multiSelections) {
        properties.push('multiSelections');
    }
    const result = await window.electron.ipcRenderer.invoke(
        'open-file-dialog',
        {
            title: options.title || 'Select a file',
            defaultPath: options.defaultPath,
            filters: options.filters,
            properties,
        }
    );

    if (result.canceled) {
        return null;
    }

    if (options.multiSelections) {
        return result.filePaths;
    }

    return result.filePaths[0];
};
