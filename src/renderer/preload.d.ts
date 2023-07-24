import { ElectronHandler } from 'main/preload';
import { KapetaBrowserAPI } from './kapeta';

declare global {
    interface Window {
        electron: ElectronHandler;
        Kapeta: KapetaBrowserAPI;
    }
}

export {};
