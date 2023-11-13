/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { useEffect, useMemo, useState } from 'react';
import { SettingsInformation } from '../../shared/types';

const CHANNEL = 'settings';

export const useAppSettings = () => {
    const [data, setData] = useState<SettingsInformation | null>(null);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        return window.electron.ipcRenderer.on(CHANNEL, (data: SettingsInformation) => {
            setData(data);
            setOpen(true);
        });
    }, []);

    return useMemo(
        () => ({
            open,
            data,
            close: () => {
                setOpen(false);
            },
        }),
        [open, data, setOpen]
    );
};
