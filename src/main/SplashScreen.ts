import { BrowserWindow } from 'electron';
import { resolveHtmlPath } from './util';
import { StatusCheck } from './SplashScreenStatus';

interface SplashState {
    text: string;
    docker: StatusCheck;
    cluster: StatusCheck;
}

export class SplashScreen {
    private activeWindow: BrowserWindow | null = null;

    private status: SplashState = {
        text: 'Loading...',
        docker: StatusCheck.LOADING,
        cluster: StatusCheck.LOADING,
    };

    open(initialStatus: SplashState | null = null) {
        this.activeWindow = new BrowserWindow({
            frame: false,
            alwaysOnTop: true,
            transparent: true,
            center: true,
            modal: true,
            useContentSize: true,
            hiddenInMissionControl: true,
            resizable: false,
            webPreferences: {
                devTools: false,
            },
        });
        this.activeWindow.loadURL(resolveHtmlPath('splash.html'));
        this.activeWindow.center();
        this.setStatus(initialStatus);
    }

    close() {
        this.activeWindow?.destroy();
        this.activeWindow = null;
    }

    setStatus(status: Partial<SplashState> | null) {
        this.status = { ...this.status, ...status };
        const search = new URLSearchParams(Object.entries(this.status));
        this.activeWindow?.loadURL(
            `${resolveHtmlPath('splash.html')}#${search.toString()}`
        );
    }
}
