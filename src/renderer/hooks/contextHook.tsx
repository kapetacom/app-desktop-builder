import React, { createContext, useContext, useEffect, useState } from 'react';
import { MemberIdentity } from '@kapeta/ui-web-types';
import { useAsyncRetry } from 'react-use';

export const useKapetaContext = () => {
    return useContext(KapetaContext);
};

export const useInternalKapetaContext = () => {
    const [activeContext, setActiveContext] = useState<MemberIdentity>();

    const contextData = useAsyncRetry(async () => {
        return window.electron.ipcRenderer.invoke('get-contexts') as Promise<{
            memberships: MemberIdentity[];
            current: string;
        }>;
    }, []);

    useEffect(() => {
        return window.electron.ipcRenderer.on('auth', () => {
            contextData.retry.call(null);
        });
    }, [contextData.retry]);

    useEffect(() => {
        if (contextData.value && !activeContext) {
            const active = contextData.value.memberships.find(
                (m) => m.identity.handle === contextData.value!.current
            );
            setActiveContext(active);
        }
    }, [contextData.value, activeContext]);

    return {
        activeContext,
        setActiveContext,
        contexts: contextData.value,
        loading: contextData.loading,
    };
};

export const KapetaContext = createContext<
    ReturnType<typeof useInternalKapetaContext>
>({
    activeContext: undefined,
    setActiveContext: () => null,
    contexts: undefined,
    loading: false,
});

export const KapetaContextProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const context = useInternalKapetaContext();

    return (
        <KapetaContext.Provider value={context}>
            {children}
        </KapetaContext.Provider>
    );
};
