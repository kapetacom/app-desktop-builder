import { useEffect } from 'react';
import { showToasty, ToastType, useConfirm } from '@kapeta/ui-web-components';
import { useNotificationEmitter } from 'renderer/hooks/useNotifications';
import { StateNotificationType } from '../components/shell/types';

interface AutoUpdateResult {
    state: 'AVAILABLE' | 'NOT_AVAILABLE' | 'FAILED';
    currentVersion?: string;
    nextVersion?: string;
    errorMessage?: string;
}

interface AutoUpdaterState {
    type: 'checking' | 'download:start' | 'download:complete' | 'done';
    initiatedByUser: boolean;
    data?: AutoUpdateResult;
}

const CHANNEL = 'auto-updater';

export const useAutoUpdater = () => {
    const notificationEmitter = useNotificationEmitter();

    const confirm = useConfirm();

    useEffect(() => {
        const showUpdateInstalled = async (nextVersion: string) => {
            const ok = await confirm({
                title: 'Update installed',
                content: `Kapeta has been updated to version ${nextVersion}. Please restart the app to apply the update.`,
                cancellationText: 'Later',
                confirmationText: 'Restart now',
            });

            if (!ok) {
                return;
            }

            await window.electron.ipcRenderer.invoke('quit-and-install');
        };

        const showProgress = (message: string, initiatedByUser: boolean) => {
            if (!initiatedByUser) {
                // Don't show progress notifications if the user did not initiate the update
                return;
            }
            notificationEmitter({
                id: 'auto-updater',
                type: 'progress',
                progress: -1,
                timestamp: Date.now(),
                message,
                read: false,
            });
        };

        const showStatus = (type: StateNotificationType, message: string, initiatedByUser: boolean) => {
            if (initiatedByUser) {
                // User initiated the update, show a toasty
                switch (type) {
                    case 'error':
                        showToasty({
                            type: ToastType.DANGER,
                            message,
                            title: 'Update failed',
                        });
                        break;

                    case 'info':
                        showToasty({
                            type: ToastType.SUCCESS,
                            message,
                            title: 'No updates available',
                        });
                        break;
                }
                notificationEmitter({
                    id: 'auto-updater',
                    type,
                    timestamp: Date.now(),
                    message,
                    read: false,
                });
            }
        };

        const handler = async (evt: AutoUpdaterState) => {
            switch (evt.type) {
                case 'checking':
                    showProgress('Checking for updates...', evt.initiatedByUser);
                    break;
                case 'download:start':
                    showProgress('Downloading update...', evt.initiatedByUser);
                    break;
                case 'download:complete':
                    showProgress('Download complete', evt.initiatedByUser);
                    break;
                case 'done':
                    switch (evt.data?.state) {
                        case 'AVAILABLE':
                            showStatus(
                                'success',
                                `Update installed: ${evt.data?.nextVersion}. Restart to apply the update.`,
                                evt.initiatedByUser
                            );
                            await showUpdateInstalled(evt.data?.nextVersion || 'Unknown');
                            break;
                        case 'NOT_AVAILABLE':
                            showStatus(
                                'info',
                                'Your app is currently up to date with the latest version.',
                                evt.initiatedByUser
                            );
                            break;
                        case 'FAILED':
                            showStatus('error', `Update failed: ${evt.data?.errorMessage}`, evt.initiatedByUser);
                            break;
                    }
                    break;
            }
        };

        return window.electron.ipcRenderer.on(CHANNEL, handler);
    }, [confirm, notificationEmitter]);
};
