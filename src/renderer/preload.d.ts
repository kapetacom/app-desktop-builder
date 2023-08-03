import { ElectronHandler, KapetaDesktop } from 'main/preload';
import { KapetaBrowserAPI } from './kapeta';

declare global {
    interface Window {
        electron: ElectronHandler;
        Kapeta: KapetaBrowserAPI;
        KapetaDesktop: KapetaDesktop;
    }
}

export {};
