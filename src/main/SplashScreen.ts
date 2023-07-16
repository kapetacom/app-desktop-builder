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
            width: 500,
            height: 300,
            frame: false,
            alwaysOnTop: true,
            hiddenInMissionControl: true,
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
