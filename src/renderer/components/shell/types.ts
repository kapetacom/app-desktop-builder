export interface MenuSection {
    id: string;
    path?: string;
    name: string;
    url: string;
    loading: boolean;
    error?: string;
    open: boolean;
    hidden?: boolean;
    requiredAccess?: string[];
    // submenu?: FragmentMenuItem[];
}

export interface UserProfile {
    handle: string;
    name: string;
    avatar?: string;
    id?: string;
    organization?: string;
    url?: string;
}

export interface Context {
    handle: string;
    name: string;
    avatar?: string;
    current?: boolean;
    type: string;
    url?: string;
}

/**
 * Proposal for a new notification format
 */
export interface CommentNotification {
    id: string;
    type: 'comment';
    message: string;
    timestamp: number;
    read: boolean;
    author: UserProfile;
}

export interface StateNotification {
    id: string;
    type: 'error' | 'warning' | 'info' | 'success';
    message: string;
    timestamp: number;
    read: boolean;
}
export type KapetaNotification = StateNotification | CommentNotification;

/**
 * Proposal for a new change set format
 */
export interface ChangeSet {
    assetType: 'deployment' | 'plan' | 'block';
    assetId: string;
    assetName: string;
    assetUrl: string;
    message: string;
    timestamp: number;
    read: boolean;
}
