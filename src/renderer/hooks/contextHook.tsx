import React, { createContext, useContext, useEffect, useState } from 'react';
import { Asset, MemberIdentity, SchemaKind } from '@kapeta/ui-web-types';
import { useAsyncRetry } from 'react-use';
import { AssetDisplay } from '@kapeta/ui-web-components';
import { Plan } from '@kapeta/schemas';

export type BlockHubSelectionCallback = (selection: AssetDisplay[]) => void;

interface BlockHubOpener {
    source?: Asset<Plan>;
    callback?: BlockHubSelectionCallback;
}

export const useKapetaContext = () => {
    return useContext(KapetaContext);
};

interface KapetaContextData {
    activeContext?: MemberIdentity;
    setActiveContext: (ctx: MemberIdentity) => void;
    contexts?: {
        memberships: MemberIdentity[];
        current: string;
    };
    loading: boolean;
    blockHub: {
        visible: boolean;
        opener?: BlockHubOpener;
        close: () => void;
        open: (
            source?: Asset,
            callback?: (selection: AssetDisplay[]) => void
        ) => void;
    };
}

const createKapetaContext = (): KapetaContextData => {
    const [activeContext, setActiveContext] = useState<MemberIdentity>();
    const [blockHubVisible, setBlockHubVisible] = useState(false);
    const [blockHubOpener, setBlockHubOpener] = useState<BlockHubOpener>();

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
        blockHub: {
            visible: blockHubVisible,
            opener: blockHubOpener,
            close() {
                setBlockHubOpener(undefined);
                setBlockHubVisible(false);
            },
            open(
                source?: Asset<Plan>,
                callback?: (selection: AssetDisplay[]) => void
            ) {
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
    setActiveContext: () => null,
    contexts: undefined,
    loading: false,
    blockHub: {
        visible: false,
        open: () => {},
        close: () => {},
    },
});

export const KapetaContextProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const context = createKapetaContext();

    return (
        <KapetaContext.Provider value={context}>
            {children}
        </KapetaContext.Provider>
    );
};
