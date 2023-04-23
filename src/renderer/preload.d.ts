import { ElectronHandler } from 'main/preload';
import {KapetaAPI} from "./kapeta";

declare global {
    interface Window {
        electron: ElectronHandler;
        Kapeta: KapetaAPI;
    }
}

export {};
