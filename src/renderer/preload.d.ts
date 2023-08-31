import { ElectronHandler, KapetaDesktop } from 'main/preload';
import { KapetaBrowserAPI } from './kapeta';

interface PageProperties {
    title?: string;
    url?: string;
    path?: string;
    referrer?: string;
    [key: string]: any;
}

interface IdentityTraits {
    name?: string;
    email?: string;
    nickname?: string;
    username?: string;
    createdAt?: Date;
    company?: {
        id?: string;
        name?: string;
        industry?: string;
        employee_count?: number;
        plan?: string;
    };
    plan?: string;
    [key: string]: any;
}

interface GroupTraits {
    id?: string;
    website?: string;
    name?: string;
    industry?: string;
    createdAt?: Date;
    employees?: number;
    plan?: string;
    'total billed'?: number;
    [key: string]: any;
}

interface TrackProps {
    revenue?: number;
    value?: number;
    currency?: string;
    [key: string]: any;
}

declare global {
    interface Window {
        electron: ElectronHandler;
        Kapeta: KapetaBrowserAPI;
        KapetaDesktop: KapetaDesktop;
        analytics: {
            identify: (userId: string, traits?: IdentityTraits) => void;
            track: (event: string, properties?: TrackProps) => void;
            page: (name: string, properties?: PageProperties) => void;
            group: (groupId: string, traits?: GroupTraits) => void;
        };
    }
}

export {};
