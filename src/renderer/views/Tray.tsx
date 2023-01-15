import React from 'react';
import {electronRemote} from "@blockware/ui-web-utils";

let mainWindow:any;

async function ensureWindow () {
    if (mainWindow &&
        !mainWindow.isDestroyed()) {
        if (mainWindow.isVisible()) {
            mainWindow.show();
        } else {
            mainWindow.focus();
        }
        return;
    }

    const remote = electronRemote();
    const BrowserWindow = remote.BrowserWindow;
    // Create the main window.
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        title: 'Blockware Desktop',
        titleBarStyle: 'hiddenInset',
        width: 1200,
        height: 600
    });

    if (remote.app.dock) {
        remote.app.dock.show();
    }

    mainWindow.on('closed', () => {
        if (remote.app.dock) {
            remote.app.dock.hide();
        }
    });

    try {
        // @ts-ignore
        await mainWindow.loadURL(window.MAIN_FILE_URL);
    } catch (e) {
        console.error('Failed to open application', e.stack);
    }
}


function closeApp() {
    const remote = electronRemote();
    remote.app.exit(0);
}

export default function Tray(props: any) {

    return (
        <>
            <div>
                Tray Test!
            </div>
            <button onClick={ensureWindow}>
                Open main window
            </button>

            <button onClick={closeApp}>
                Quit
            </button>
        </>
    );
};
