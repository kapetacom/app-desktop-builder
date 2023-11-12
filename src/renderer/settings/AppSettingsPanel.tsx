import { useAppSettings } from './hooks';
import { isMac } from '../utils/osUtils';
import React from 'react';
import { FormField, FormFieldType, FormInput, KapFormDialog, SimpleLoader } from '@kapeta/ui-web-components';
import { Alert, Button } from '@mui/material';
import { FileSystemService } from '../api/FileSystemService';
import { useAsyncRetry } from 'react-use';
import { FolderField } from '../components/fields/FolderField';

export interface AppSettings {
    editor: string | null;
    projectHome: string | null;
}

export const AppSettingsPanel = () => {
    const appSettings = useAppSettings();

    const initialData = useAsyncRetry(async (): Promise<AppSettings> => {
        const projectHome = await FileSystemService.getProjectFolder();
        const editor = await FileSystemService.getEditor();
        return {
            projectHome,
            editor: editor || appSettings.data?.defaultEditor?.editor || null,
        };
    }, [appSettings.data?.defaultEditor?.editor]);

    return (
        <KapFormDialog
            initialValue={initialData.value}
            onSubmitData={async (data: AppSettings) => {
                if (data.projectHome && data.projectHome !== initialData.value?.projectHome) {
                    await FileSystemService.setProjectFolder(data.projectHome);
                }

                if (data.editor && data.editor !== initialData.value?.editor) {
                    await FileSystemService.setEditor(data.editor);
                }
                initialData.retry();
                appSettings.close();
            }}
            actions={
                <>
                    <Button color={'inherit'} onClick={appSettings.close}>
                        Close
                    </Button>
                    <Button color={'primary'} type={'submit'}>
                        Save
                    </Button>
                </>
            }
            title={isMac() ? 'Preferences' : 'Settings'}
            open={appSettings.open}
            onClose={appSettings.close}
        >
            <Alert severity={'info'}>These settings controls how Kapeta interacts with your computer.</Alert>
            <FormField
                type={FormFieldType.ENUM}
                options={appSettings.data?.editors.map((editor) => editor.editor) ?? []}
                name={'editor'}
                label={'Code Editor'}
                help={'The editor to use when opening a file or folder from Kapeta.'}
            />
            <FolderField
                name={'projectHome'}
                label={'Project folder'}
                help={'Select the folder where your assets will be created by default.'}
            />
        </KapFormDialog>
    );
};
