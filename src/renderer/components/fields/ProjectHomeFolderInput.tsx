import { FormRow, SimpleLoader } from '@kapeta/ui-web-components';
import React, { useEffect, useState } from 'react';
import { useAsync } from 'react-use';
import { FileSystemService } from '@kapeta/ui-web-context';
import { FileBrowserDialog } from '../file-browser/FileBrowserDialog';

import './ProjectHomeFolderInput.less';

export interface ProjectHomeFolderInputProps {
    onChange?: (enable: boolean, home: string) => void;
}

export const ProjectHomeFolderInput = (props: ProjectHomeFolderInputProps) => {
    const [showFileBrowser, setShowFileBrowser] = useState(false);

    const [projectHome, setProjectHome] = useState<string>('');
    const [isEnabled, setEnabled] = useState<boolean>(false);

    const { value: storedProjectHome, loading: loadingStored } = useAsync(
        () => FileSystemService.getProjectFolder(),
        []
    );

    useEffect(() => {
        if (loadingStored) {
            return;
        }

        const folder = storedProjectHome ?? '';
        const enabled = !!folder;
        setProjectHome(folder);
        setEnabled(enabled);

        props.onChange && props.onChange(enabled, folder);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storedProjectHome, loadingStored]);

    return (
        <SimpleLoader loading={loadingStored}>
            <FormRow
                label="Project folder"
                help={
                    isEnabled
                        ? 'Choose project home to create this asset in'
                        : 'Check this to save asset in project home'
                }
                focused
                validation={isEnabled ? ['required'] : []}
                type="folder"
            >
                <div
                    data-name="project_home"
                    data-value={projectHome}
                    className="project-home-folder-input"
                >
                    <input
                        type="checkbox"
                        data-name="use_project_home"
                        data-value={isEnabled}
                        checked={isEnabled}
                        onChange={(evt) => {
                            props.onChange &&
                                props.onChange(
                                    evt.target.checked,
                                    projectHome ?? ''
                                );

                            setEnabled(evt.target.checked);
                        }}
                    />
                    <input
                        type="text"
                        readOnly
                        disabled={!isEnabled}
                        value={projectHome}
                        onClick={async () => {
                            if (!isEnabled) {
                                return;
                            }

                            setShowFileBrowser(true);
                        }}
                    />
                </div>
            </FormRow>
            <FileBrowserDialog
                open={showFileBrowser}
                service={FileSystemService}
                skipFiles={[]}
                onSelect={async (file) => {
                    props.onChange &&
                        props.onChange(isEnabled ?? false, file.path);

                    if (file.path) {
                        await FileSystemService.setProjectFolder(file.path);
                        setProjectHome(file.path);
                    }
                    setShowFileBrowser(false);
                }}
                onClose={() => {
                    setShowFileBrowser(false);
                }}
                selectable={(file) => {
                    return !!file.folder;
                }}
            />
        </SimpleLoader>
    );
};
