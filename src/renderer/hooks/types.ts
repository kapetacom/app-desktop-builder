import { MemberIdentity } from '@kapeta/ui-web-types';

export interface TabInfo {
    path: string;
    title?: string;
    loading?: boolean;
    contextId?: string;
}

export interface TabOptions {
    title?: string;
    contextId?: string;
    navigate?: boolean;
}
export interface MainTabs {
    current: TabInfo;
    open: (path: string, opts?: TabOptions) => void;
    close: (path: string) => void;
    setTitle: (path: string, title: string) => void;
    setContext: (path: string, contextId: string) => void;
    active: TabInfo[];
}
