/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { BrowserWindow } from 'electron';
import { getPreloadScript, resolveHtmlPath, safeSend, WindowOpenHandler } from '../helpers';
import { EventEmitter } from 'node:events';

interface Props {
    title?: string;
    text?: string;
    linkText?: string;
    link?: string;
}

export class ModalProcessing extends EventEmitter {
    private win: BrowserWindow | null = null;

    constructor() {
        super();
    }

    async open(parent: BrowserWindow | undefined, props: Props) {
        if (this.win) {
            this.setProps(props);
            return;
        }
        this.win = new BrowserWindow({
            frame: false,
            show: true,
            transparent: process.platform === 'darwin',
            alwaysOnTop: false,
            parent: parent,
            width: 500,
            height: process.platform === 'darwin' ? 250 : 220,
            center: true,
            modal: true,
            closable: true,
            hiddenInMissionControl: true,
            resizable: false,
            webPreferences: {
                preload: getPreloadScript(),
                devTools: false,
                nodeIntegration: true,
                contextIsolation: true,
            },
        });

        this.win.on('close', () => {
            this.win = null;
            this.emit('close');
        });
        await this.win.loadURL(resolveHtmlPath('processing.html'));

        this.win.webContents.setWindowOpenHandler(WindowOpenHandler);
        // Open urls in the user's browser
        this.setProps(props);
    }

    close() {
        this.win?.destroy();
        this.win = null;
        this.emit('close');
    }

    setProps(props: Props) {
        if (!this.win) {
            throw new Error('Processing modal is not open');
        }
        safeSend(this.win.webContents, 'processing', ['changed', props]);
    }
}
