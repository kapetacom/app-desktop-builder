import { useMemo, useState } from 'react';
import { SectionFrameElement } from '@kapeta/web-microfrontend/src/browser/components/SectionFrameElement';
import { useKapetaContext } from '../../hooks/contextHook';
import { useAuthToken } from '../../utils/tokenHelper';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { SimpleLoader } from '@kapeta/ui-web-components';
import { normalizeUrl, useMainTabs } from '../../hooks/mainTabs';
import { FrameContextInfo } from '@kapeta/web-microfrontend/src/browser/components/FragmentContext';

interface Props {
    path: string;
    baseUrl: string;
}

export const RemoteFrame = (props: Props) => {
    const context = useKapetaContext();
    const mainTabs = useMainTabs();
    const token = useAuthToken();
    const location = useLocation();
    const [ready, setReady] = useState(false);

    const normalizedPath = normalizeUrl(`/${props.path}`);
    const currentTab = mainTabs.active.find((tab) => tab.path === normalizedPath);

    const frameContext = useMemo<FrameContextInfo | undefined>(() => {
        if (currentTab?.contextId) {
            // If the tab has a contextId, it means it is a context tab
            if (context.profile?.id === currentTab.contextId) {
                return {
                    ...context.profile,
                    access: ['*'],
                };
            }
            const membership = context.contexts?.memberships.find((m) => m.identity.id === currentTab.contextId);
            if (membership) {
                return {
                    id: membership.identity.id,
                    handle: membership.identity.handle,
                    name: membership.identity.name,
                    access: membership.scopes,
                    type: membership.identity.type,
                };
            }
        }
        if (!context.activeContext) {
            return undefined;
        }
        return {
            id: context.activeContext.identity.id,
            handle: context.activeContext.identity.handle,
            name: context.activeContext.identity.name,
            access: context.activeContext.scopes,
            type: context.activeContext.identity.type,
        };
    }, [currentTab, context.activeContext]);

    const initialSrc = useMemo(() => {
        if (!token.value) {
            return undefined;
        }
        return `${props.baseUrl}/${props.path}?token=${token.value}`;
    }, [token.value]);

    const origin = useMemo(() => {
        return new URL(props.baseUrl).origin;
    }, []);

    const loading = !ready || context.loading || token.loading;

    return (
        <Box
            sx={{
                height: '100%',
                width: '100%',
                '& > iframe': {
                    height: '100%',
                    width: '100%',
                    // Remove the built-in border
                    border: 0,
                },
                '& > .simple-loader': {
                    height: '100%',
                    width: '100%',
                },
            }}
        >
            <SimpleLoader loading={loading} />
            {initialSrc && (
                <SectionFrameElement
                    initialSrc={initialSrc}
                    origin={origin}
                    currentPath={props.path}
                    context={frameContext}
                    onReady={() => {
                        setReady(true);
                    }}
                    onTitleChange={(data) => {
                        mainTabs.setTitle(data.path, data.title);
                    }}
                    onNavigateTop={(toPath) => {
                        if (location.pathname !== toPath) {
                            mainTabs.open(toPath, { contextId: frameContext?.id, navigate: true });
                        }
                    }}
                    onNavigate={(toPath) => {
                        if (location.pathname !== toPath) {
                            mainTabs.open(toPath, { contextId: frameContext?.id, navigate: true });
                        }
                    }}
                />
            )}
        </Box>
    );
};
