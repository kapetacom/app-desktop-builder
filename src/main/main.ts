/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {app, BrowserWindow, shell, ipcMain, Tray, Menu, MenuItemConstructorOptions} from 'electron';
import {autoUpdater} from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import {resolveHtmlPath} from './util';
import MenuItem = Electron.MenuItem;

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const ensureWindow = () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.focus();
  }
}

const refreshTray = () => {
  if (!tray) {
    tray = new Tray(getAssetPath('icons/16x16.png'));
    tray.setToolTip('Blockware Desktop')
  }
  const menuItems: Array<(MenuItemConstructorOptions) | (MenuItem)> = [
    {label: 'Blockware is running', enabled: false},
    {type: 'separator'},
    {
      label: 'Dashboard',
      click: ensureWindow
    },
    {
      type: 'submenu',
      label: 'hofmeister',
      submenu: [
        {
          label: 'Account Settings',
          click: () => {
            shell.openExternal(
              'https://app.blockware.com/hofmeister/iam'
            );
          }
        },
        {
          label: 'Sign out'
        }
      ]
    },
    {type: 'separator'},
    {
      label: 'Open Blockware Cloud', click: () => {
        shell.openExternal(
          'https://app.blockware.com'
        );
      }
    },
    {type: 'separator'},
    { label: 'Quit Blockware', click: () => app.quit()}
  ]
  const contextMenu = Menu.buildFromTemplate(menuItems);
  tray.setContextMenu(contextMenu);
}

const showDock = async () => {
  if (!app.dock) {
    return;
  }
  app.dock.setIcon(getAssetPath('icon.png'));
  app.dock.setBadge('Blockware');
  await app.dock.show();
};

const hideDock = () => {
  if (!app.dock) {
    return;
  }

  app.dock.hide();
}

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  refreshTray();
  await hideDock();

  mainWindow.maximize();
  await mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('show', showDock);

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
      hideDock();
    } else {
      mainWindow.show();
      showDock();
    }

  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    hideDock();
    refreshTray();
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return {action: 'deny'};
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};


/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  //Do not close app when windows close. We have the tray still
});

app
  .whenReady()
  .then(() => {
    hideDock();
    createWindow();
    refreshTray();

    app.on('activate', ensureWindow);
  })
  .catch(console.log);
