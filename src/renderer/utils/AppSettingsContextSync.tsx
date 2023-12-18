import { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { FileSystemService } from '../api/FileSystemService';
import { DesktopAppSettings } from '../../main/services/SettingsService';

export const AppSettingsContext = createContext<DesktopAppSettings>({
    show_pixel_grid: false,
    snap_to_pixel_grid: false,
});

export const AppSettingsContextSync = (props: PropsWithChildren) => {
    const [settings, setSettings] = useState<DesktopAppSettings>({
        show_pixel_grid: false,
        snap_to_pixel_grid: false,
    });

    // Initial load settings from FileSystemService
    useEffect(() => {
        (async () => {
            const show_pixel_grid = await FileSystemService.getShowPixelGrid();
            const snap_to_pixel_grid = await FileSystemService.getSnapToPixelGrid();
            setSettings({
                show_pixel_grid,
                snap_to_pixel_grid,
            });
        })();
    }, []);

    // Listen for changes from main process
    useEffect(() => {
        return window.electron.ipcRenderer.on('desktop-app-settings', (data: DesktopAppSettings) => {
            setSettings(data);
            console.log('desktop-app-settings', data);
        });
    }, []);

    return <AppSettingsContext.Provider value={settings}>{props.children}</AppSettingsContext.Provider>;
};
