import React, { createContext, useContext, useEffect, useState } from 'react';
import { Identity, MemberIdentity, SchemaKind } from '@kapeta/ui-web-types';
import { useAsyncRetry, useClickAway } from 'react-use';
import { AssetDisplay } from '@kapeta/ui-web-components';
import { Plan } from '@kapeta/schemas';
import { IdentityService } from '@kapeta/ui-web-context';
import { AssetInfo } from '@kapeta/ui-web-plan-editor';

export type BlockHubSelectionCallback = (selection: AssetDisplay[]) => void;

interface BlockHubOpener {
    source?: AssetInfo<Plan>;
    callback?: BlockHubSelectionCallback;
}

export const useKapetaContext = () => {
    return useContext(KapetaContext);
};

interface KapetaContextData {
    activeContext?: MemberIdentity;
    profile?: Identity;
    setProfile: (identity: Identity) => void;
    setActiveContext: (ctx: MemberIdentity) => void;
    logOut: () => Promise<boolean>;
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

const createKapetaContext = (): KapetaContextData => {
    const [activeContext, setActiveContext] = useState<MemberIdentity>();
    const [profile, setProfile] = useState<Identity>();
    const [blockHubVisible, setBlockHubVisible] = useState(false);
    const [blockHubOpener, setBlockHubOpener] = useState<BlockHubOpener>();

    const contextData = useAsyncRetry(async () => {
        return window.electron.ipcRenderer.invoke('get-contexts') as Promise<{
            memberships: MemberIdentity[];
            current: string;
        }>;
    }, []);

    const profileData = useAsyncRetry(async () => {
        return IdentityService.getCurrent();
    }, []);

    useEffect(() => {
        return window.electron.ipcRenderer.on('auth', () => {
            contextData.retry();
            profileData.retry();
        });
    }, [contextData.retry, profileData.retry]);

    useEffect(() => {
        if (contextData.value) {
            const active = contextData.value.memberships.find((m) => m.identity.handle === contextData.value!.current);
            setActiveContext(active);
        }
    }, [contextData.value]);

    useEffect(() => {
        if (!profileData.loading) {
            setProfile(profileData.value);
        }
    }, [profileData.value, profileData.loading]);

    return {
        profile,
        setProfile,
        activeContext,
        setActiveContext: (context?: MemberIdentity | undefined) => {
            const handle = !context || context.identity.type === 'user' ? undefined : context.identity.handle;
            setActiveContext(context);
            window.electron.ipcRenderer.invoke('set-context', handle);
        },
        logOut: async () => {
            const logOutPromise = window.electron.ipcRenderer.invoke('log-out') as Promise<boolean>;
            if (await logOutPromise) {
                setActiveContext(undefined);
                setProfile(undefined);
                profileData.retry();
                contextData.retry();
                return true;
            }

            console.log('Did not log out');
            return false;
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
        contexts: contextData.value,
        loading: contextData.loading,
    };
};

export const KapetaContext = createContext<KapetaContextData>({
    activeContext: undefined,
    profile: undefined,
    setProfile: () => null,
    setActiveContext: () => null,
    logOut: () => Promise.resolve(false),
    contexts: undefined,
    loading: false,
    blockHub: {
        visible: false,
        open: () => {},
        close: () => {},
    },
});

export const KapetaContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const context = createKapetaContext();

    return <KapetaContext.Provider value={context}>{children}</KapetaContext.Provider>;
};
