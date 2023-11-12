/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { FormFieldProps, SimpleLoader, useFormContextField, useFormFieldController } from '@kapeta/ui-web-components';
import React, { useEffect, useState } from 'react';
import { useAsync } from 'react-use';
import { Checkbox, FormControl, Input, InputLabel, Stack, TextField } from '@mui/material';
import { showFilePickerOne } from '../../utils/showFilePicker';
import { FileSystemService } from '../../api/FileSystemService';

export interface FolderFieldProps extends Omit<FormFieldProps, 'type'> {}

export const FolderField = (props: FolderFieldProps) => {
    const controller = useFormFieldController({
        ...props,
    });

    const formField = useFormContextField<string>(controller.name);

    return (
        <TextField
            sx={{
                display: 'block',
                my: 1,
                '.MuiInputBase-root': {
                    width: '100%',
                },
            }}
            className={controller.className}
            autoFocus={controller.autoFocus}
            onFocus={controller.onFocus || undefined}
            onBlur={controller.onBlur || undefined}
            autoComplete={controller.autoComplete || undefined}
            variant={controller.variant || 'standard'}
            label={controller.label}
            helperText={controller.help}
            disabled={controller.disabled}
            name={controller.name}
            required={controller.required}
            error={controller.showError}
            value={formField.get('')}
            InputLabelProps={{
                shrink: true,
            }}
            InputProps={{
                readOnly: true,
            }}
            onClick={async () => {
                if (controller.readOnly || controller.disabled) {
                    return;
                }

                const result = await showFilePickerOne({
                    title: 'Select ' + controller.label,
                    selectDirectory: true,
                });

                formField.set(result?.path ?? '');
            }}
        />
    );
};
