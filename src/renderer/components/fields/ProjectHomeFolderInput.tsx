/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { SimpleLoader, useFormFieldController } from '@kapeta/ui-web-components';
import React, { useEffect, useState } from 'react';
import { useAsync } from 'react-use';
import { Checkbox, FormControl, Input, InputLabel, Stack } from '@mui/material';
import { showFilePickerOne } from '../../utils/showFilePicker';
import { FileSystemService } from '../../api/FileSystemService';

export interface ProjectHomeFolderInputProps {
    onChange?: (enable: boolean, home: string) => void;
}

export const ProjectHomeFolderInput = (props: ProjectHomeFolderInputProps) => {
    const [projectHome, setProjectHome] = useState<string>('');
    const [isEnabled, setEnabled] = useState<boolean>(false);

    const controller = useFormFieldController({
        name: 'project_home',
        value: projectHome,
        label: 'Project folder',
        help: isEnabled ? 'Choose project home to create this asset in' : 'Check this to save asset in project home',

        validation: isEnabled ? ['required'] : [],
    });

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
            <FormControl
                disabled={controller.disabled}
                required={controller.required}
                error={controller.showError}
                autoFocus={controller.autoFocus}
                variant={'standard'}
                sx={{
                    display: 'block',
                    mt: 1,
                    mb: 1,
                    '.MuiFormHelperText-root': {
                        ml: 0,
                    },
                }}
            >
                <InputLabel shrink={true} required={controller.required}>
                    {controller.label}
                </InputLabel>
                <Stack gap={1} justifyContent={'stretch'} direction={'row'} pt={2}>
                    <Checkbox
                        checked={isEnabled}
                        onChange={(evt) => {
                            props.onChange && props.onChange(evt.target.checked, projectHome ?? '');

                            setEnabled(evt.target.checked);
                        }}
                    />
                    <Input
                        type="text"
                        sx={{
                            flex: 1,
                        }}
                        readOnly
                        disabled={!isEnabled}
                        value={projectHome}
                        onClick={async () => {
                            if (!isEnabled) {
                                return;
                            }

                            const result = await showFilePickerOne({
                                title: 'Choose project home',
                                selectDirectory: true,
                            });

                            if (result?.path) {
                                setProjectHome(result.path);
                                props.onChange && props.onChange(isEnabled, result.path);
                            }
                        }}
                    />
                </Stack>
            </FormControl>
        </SimpleLoader>
    );
};
