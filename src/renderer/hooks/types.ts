export interface TabInfo {
    path: string;
    title?: string;
    loading?: boolean;
}

export interface TabOptions {
    title?: string;
    navigate?: boolean;
}
export interface MainTabs {
    current: TabInfo;
    open: (path: string, opts?: TabOptions) => void;
    close: (path: string) => void;
    setTitle: (path: string, title: string) => void;
    active: TabInfo[];
}
