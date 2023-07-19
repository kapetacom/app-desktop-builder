import { BrowserWindow } from 'electron';
import { resolveHtmlPath } from './util';
import {EventEmitter} from "node:events";

interface Props {
    text?: string;
    linkText?: string;
    link?: string;
}
export class ModalProcessing extends EventEmitter {
    private activeWindow: BrowserWindow | null = null;

    constructor() {
        super();
    }

    open(parent:BrowserWindow, props: Props) {
        if (this.activeWindow) {
            this.setProps(props);
            return;
        }
        this.activeWindow = new BrowserWindow({
            frame: false,
            alwaysOnTop: true,
            transparent: true,
            parent: parent,
            width: 400,
            height: 200,
            center: true,
            modal: true,
            closable: true,
            useContentSize: true,
            hiddenInMissionControl: true,
            resizable: false,
            webPreferences: {
                devTools: false,
                nodeIntegration: true,
            },

        });
        this.activeWindow.on('close', () => {
            this.activeWindow = null;
            this.emit('close');
        })
        this.setProps(props);
    }

    close() {
        this.activeWindow?.destroy();
        this.activeWindow = null;
        this.emit('close');
    }

    setProps(props: Props) {
        const search = new URLSearchParams(Object.entries(props));
        this.activeWindow?.loadURL(
            `${resolveHtmlPath('processing.html')}#${search.toString()}`
        );
    }
}
