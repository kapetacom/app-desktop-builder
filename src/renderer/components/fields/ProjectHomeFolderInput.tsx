import {FormRow, SimpleLoader, useFormContextField} from "@blockware/ui-web-components";
import React, {useEffect, useState} from "react";
import {FileSystemService} from "@blockware/ui-web-context";
import {FileBrowserDialog} from "../file-browser/FileBrowserDialog";
import {useAsync} from "react-use";


import './ProjectHomeFolderInput.less';

export interface ProjectHomeFolderInputProps {
    enabledName?:string;
    folderName?:string;
    onChange?: (enable: boolean, home:string) => void;
}



export const ProjectHomeFolderInput = (props: ProjectHomeFolderInputProps) => {

    const [showFileBrowser, setShowFileBrowser] = useState(false);

    let isEnabled:boolean,
        projectHome:string;
    let setEnabled:(val:boolean) => void;
    let setProjectHome:(val:string) => void;
    if (props.folderName && props.enabledName) {
        const folderNameField = useFormContextField<string>(props.folderName);
        const enabledNameField = useFormContextField<boolean>(props.enabledName);
        isEnabled = enabledNameField.get();
        projectHome = folderNameField.get();
        setEnabled = enabledNameField.set.bind(enabledNameField);
        setProjectHome = folderNameField.set.bind(folderNameField);
    } else {
        const [projectHomeFromState, setProjectHomeForState] = useState<string>('');
        const [isEnabledFromState, setEnabledForState] = useState<boolean>(false);
        isEnabled = isEnabledFromState;
        projectHome = projectHomeFromState;
        setEnabled = setEnabledForState;
        setProjectHome = setProjectHomeForState;
    }

    let {value:storedProjectHome, loading:loadingStored} = useAsync(() => FileSystemService.getProjectFolder(), []);


    useEffect(() => {
        if (loadingStored) {
            return;
        }

        const folder = storedProjectHome ?? '';
        const enabled = !!folder;
        setProjectHome(folder);
        setEnabled(enabled);
        props.onChange && props.onChange(enabled, folder);
    }, [storedProjectHome, loadingStored]);


    return (
        <SimpleLoader loading={loadingStored}>
            <FormRow
                label="Project folder"
                help={
                    isEnabled
                        ? 'Choose project home to create this block in'
                        : 'Check this to save block in project home'
                }
                focused
                validation={
                    isEnabled
                        ? ['required']
                        : []
                }
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
                    props.onChange(
                        isEnabled ?? false,
                        file.path
                    );

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
    )
};
