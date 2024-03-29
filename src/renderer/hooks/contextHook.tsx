/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Identity, MemberIdentity, SchemaKind } from '@kapeta/ui-web-types';
import { useAsyncRetry } from 'react-use';
import { AssetDisplay } from '@kapeta/ui-web-components';
import { Plan } from '@kapeta/schemas';

import { AssetInfo } from '@kapeta/ui-web-plan-editor';
import { ExtendedIdentity, IdentityService } from '../api/IdentityService';
import { SocketService } from '../api/SocketService';
import { readPostedMessage } from '@kapeta/web-microfrontend/src/browser/utils/helpers';
import { FragmentMessageTypes } from '@kapeta/web-microfrontend/src/browser/definitions/types';

const AUTH_CHANGED_EVENT = 'auth-change';
export type BlockHubSelectionCallback = (selection: AssetDisplay[]) => void;

interface BlockHubOpener {
    source?: AssetInfo<Plan>;
    callback?: BlockHubSelectionCallback;
}

export const useKapetaContext = () => {
    return useContext(KapetaContext);
};

interface LoginResult {
    success: boolean;
    error?: string;
}

interface KapetaContextData {
    refreshContexts: () => void;
    activeContext?: MemberIdentity;
    profile?: ExtendedIdentity;
    setProfile: (identity: ExtendedIdentity) => void;
    setActiveContext: (ctx: MemberIdentity) => void;
    logOut: () => Promise<boolean>;
    logIn: () => Promise<LoginResult>;
    contexts?: {
        memberships: MemberIdentity[];
        current: string;
    };
    loading: boolean;
    blockHub: {
        visible: boolean;
        opener?: BlockHubOpener;
        close: () => void;
        open: (source?: AssetInfo<SchemaKind>, callback?: (selection: AssetDisplay[]) => void) => void;
    };
}

const useKapetaContextInternal = (): KapetaContextData => {
    const [initialLoad, setInitialLoad] = useState(true);
    const [activeContext, setActiveContext] = useState<MemberIdentity>();
    const [profile, setProfile] = useState<ExtendedIdentity>();
    const [blockHubVisible, setBlockHubVisible] = useState(false);
    const [blockHubOpener, setBlockHubOpener] = useState<BlockHubOpener>();

    const data = useAsyncRetry(async () => {
        const contexts = (await window.electron.ipcRenderer.invoke('get-contexts')) as {
            memberships: MemberIdentity[];
            current: string;
        };

        const profile = await IdentityService.getCurrent();

        return {
            contexts,
            profile,
        };
    }, []);

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const msg = readPostedMessage(event);
            if (msg?.type === FragmentMessageTypes.CONTEXT_CHANGE) {
                data.retry();
            }
        };
        window.addEventListener('message', handler);
        return () => {
            window.removeEventListener('message', handler);
        };
    }, [data.retry]);

    useEffect(() => {
        return window.electron.ipcRenderer.on('auth', () => {
            data.retry();
        });
    }, [data.retry]);

    useEffect(() => {
        const handler = () => {
            data.retry();
        };
        SocketService.on(AUTH_CHANGED_EVENT, handler);
        return () => {
            SocketService.off(AUTH_CHANGED_EVENT, handler);
        };
    }, [data.retry]);

    useEffect(() => {
        if (data.loading || !data.value) {
            return;
        }

        if (data.value.contexts) {
            const active = data.value.contexts.memberships.find(
                (m) => m.identity.handle === data.value?.contexts.current
            );
            setActiveContext(active);
        } else {
            setActiveContext(undefined);
        }

        setProfile(data.value.profile);
        setInitialLoad(false);
    }, [data.loading, data.value]);

    return {
        profile,
        setProfile,
        activeContext,
        refreshContexts: () => {
            data.retry();
        },
        setActiveContext: (context?: MemberIdentity | undefined) => {
            const handle = !context || context.identity.type === 'user' ? undefined : context.identity.handle;
            setActiveContext(context);
            window.electron.ipcRenderer.invoke('set-context', handle);
            window.electron.ipcRenderer.invoke('set-context', handle).catch((e: any) => {
                console.error('Failed to set context', e);
            });
        },
        logOut: async () => {
            const logOutPromise = window.electron.ipcRenderer.invoke('log-out') as Promise<boolean>;
            if (await logOutPromise) {
                setActiveContext(undefined);
                setProfile(undefined);
                data.retry();
                return true;
            }
            return false;
        },
        logIn: async () => {
            const result = (await window.electron.ipcRenderer.invoke('log-in')) as LoginResult;
            if (result.success) {
                data.retry();
            }
            return result;
        },
        blockHub: {
            visible: blockHubVisible,
            opener: blockHubOpener,
            close() {
                setBlockHubOpener(undefined);
                setBlockHubVisible(false);
            },
            open(source?: AssetInfo<Plan>, callback?: (selection: AssetDisplay[]) => void) {
                setBlockHubOpener({ source, callback });
                setBlockHubVisible(true);
            },
        },
        contexts: data.value?.contexts,
        // Prevent flickering when reloading
        loading: initialLoad,
    };
};

export const KapetaContext = createContext<KapetaContextData>({
    refreshContexts: () => null,
    activeContext: undefined,
    profile: undefined,
    setProfile: () => null,
    setActiveContext: () => null,
    logOut: () => Promise.resolve(false),
    logIn: () => Promise.resolve({ success: false }),
    contexts: undefined,
    loading: true,
    blockHub: {
        visible: false,
        open: () => {},
        close: () => {},
    },
});

export const KapetaContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const context = useKapetaContextInternal();

    return <KapetaContext.Provider value={context}>{children}</KapetaContext.Provider>;
};
