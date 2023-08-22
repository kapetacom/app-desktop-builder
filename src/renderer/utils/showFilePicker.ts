type FileFilter = Electron.FileFilter;
type OpenDialogOptions = Electron.OpenDialogOptions;

interface Options {
    title?: string;
    multiSelections?: boolean;
    filters?: FileFilter[];
    defaultPath?: string;
    selectDirectory?: boolean;
    readContent?: boolean;
}

interface SingleResult {
    path: string;
    content: string;
}

export const showFilePickerOne = async (options: Omit<Options, 'multiSelection'>): Promise<SingleResult | null> => {
    return (await showFilePicker({
        ...options,
        readContent: true,
    })) as SingleResult | null;
};

export const showFilePickerMulti = async (
    options: Omit<Options, 'multiSelection' | 'readContent'>
): Promise<string[] | null> => {
    return (await showFilePicker({
        ...options,
        multiSelections: true,
    })) as string[] | null;
};
export const showFilePicker = async (options: Options): Promise<any> => {
    const properties: OpenDialogOptions['properties'] = ['createDirectory'];
    if (options.selectDirectory) {
        properties.push('openDirectory');
    } else {
        properties.push('openFile');
    }
    if (options.multiSelections) {
        properties.push('multiSelections');
    }
    const [dialogResult, content] = await window.electron.ipcRenderer.invoke('open-file-dialog', {
        title: options.title || 'Select a file',
        defaultPath: options.defaultPath,
        filters: options.filters,
        properties,
        readContent: options.readContent,
    });

    if (dialogResult.canceled) {
        return null;
    }

    if (options.multiSelections) {
        return dialogResult.filePaths;
    }

    return {
        path: dialogResult.filePaths[0],
        content,
    };
};
