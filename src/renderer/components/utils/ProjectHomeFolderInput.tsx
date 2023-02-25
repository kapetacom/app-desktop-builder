import {FormRow, SimpleLoader} from "@blockware/ui-web-components";
import React, {useEffect, useState} from "react";
import {FileSystemService} from "@blockware/ui-web-context";
import {FileBrowserDialog} from "../file-browser/FileBrowserDialog";
import {useAsync} from "react-use";


export interface ProjectHomeFolderInputProps {
    onChange?: (enable: boolean, home:string) => void;
}

export const ProjectHomeFolderInput = (props: ProjectHomeFolderInputProps) => {

    const [showFileBrowser, setShowFileBrowser] = useState(false);

    let {value:storedProjectHome, loading:loadingStored} = useAsync(() => FileSystemService.getProjectFolder(), []);

    const [loading, setLoading] = useState(true);
    const [projectHome, setProjectHome] = useState('');
    const [useProjectHome, setUseProjectHome] = useState(false);

    useEffect(() => {
        if (loadingStored) {
            return;
        }
        setLoading(false);

        const folder = storedProjectHome ?? '';
        const enabled = !!folder;
        setProjectHome(folder);
        setUseProjectHome(enabled);
        //We kick of an initial change to report current value
        props.onChange && props.onChange(enabled, folder);
    }, [props.onChange, storedProjectHome, loadingStored]);

    return (
        <SimpleLoader loading={loading}>
            <FormRow
                label="Project folder"
                help={
                    useProjectHome
                        ? 'Choose project home to create this block in'
                        : 'Check this to save block in project home'
                }
                focused
                validation={
                    useProjectHome
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
                        data-value={useProjectHome}
                        checked={useProjectHome}
                        onChange={(evt) => {
                            props.onChange &&
                            props.onChange(
                                evt.target.checked,
                                projectHome ?? ''
                            );
                        }}
                    />
                    <input
                        type="text"
                        readOnly
                        disabled={!useProjectHome}
                        value={projectHome}
                        onClick={async () => {
                            if (!useProjectHome) {
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
                        useProjectHome ?? false,
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
