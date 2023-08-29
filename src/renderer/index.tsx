import { createRoot } from 'react-dom/client';
import { Box, ThemeProvider } from '@mui/material';
import { RouterProvider, useParams, createMemoryRouter, useNavigate } from 'react-router-dom';
import { AssetService } from '@kapeta/ui-web-context';
import { Root } from './Root';
import { kapetaDark } from './Theme';
import { initialise } from './context';
import { PlanView } from './views/PlanView';
import { PlanOverview } from './components/plan-overview/PlanOverview';
import { useAuthToken } from './utils/tokenHelper';
import { useKapetaContext } from './hooks/contextHook';
import { usePlans } from './hooks/assetHooks';
import { SimpleLoader } from '@kapeta/ui-web-components';
import { SectionFrameElement } from '@kapeta/web-microfrontend/browser';
import { useLocation } from 'react-use';
import { useMemo, useState } from 'react';

const router = createMemoryRouter([
    {
        path: '*',
        Component: Root,
        async loader() {
            await initialise();
            return {};
        },
        children: [
            {
                path: 'edit',
                children: [
                    {
                        index: true,
                        Component: () => {
                            const navigateTo = useNavigate();
                            const plans = usePlans();

                            return (
                                <SimpleLoader loading={plans.loading}>
                                    <PlanOverview
                                        assetService={AssetService}
                                        onPlanImported={async () => {
                                            await plans.refresh();
                                        }}
                                        onPlanAdded={(plan) => {
                                            navigateTo(`/edit/${encodeURIComponent(plan.ref)}`);
                                        }}
                                        onPlanSelected={(plan) => {
                                            navigateTo(`/edit/${encodeURIComponent(plan.ref)}`);
                                        }}
                                        plans={plans.data || []}
                                    />
                                </SimpleLoader>
                            );
                        },
                    },
                    {
                        path: ':systemId',
                        Component: () => {
                            const params = useParams();
                            return <PlanView systemId={params.systemId!} />;
                        },
                    },
                ],
            },
            {
                path: 'deployments/*',
                Component: () => {
                    // iframe to deployments microfrontend
                    const context = useKapetaContext();
                    const token = useAuthToken();
                    const location = useLocation();
                    const navigateTo = useNavigate();
                    const [ready, setReady] = useState(false);
                    let { '*': path } = useParams();
                    while (path && path.startsWith('/')) {
                        path = path.substr(1);
                    }

                    if (!path) {
                        path = context.activeContext?.identity.handle ?? '';
                    }

                    const initialSrc = useMemo(
                        () => `${window.KapetaDesktop.urls.deployments}/${path}?token=${token.value}`,
                        [token.value, context.activeContext]
                    );

                    const loading = !ready || context.loading || token.loading;

                    return (
                        <Box
                            sx={{
                                height: '100%',
                                width: '100%',
                                '& > iframe': {
                                    height: '100%',
                                    width: '100%',
                                },
                                '& > .simple-loader': {
                                    height: '100%',
                                    width: '100%',
                                },
                            }}
                        >
                            <SimpleLoader loading={loading} />
                            <SectionFrameElement
                                initialSrc={initialSrc}
                                currentPath={path}
                                onReady={() => {
                                    setReady(true);
                                }}
                                onTitleChange={(data) => {
                                    context.tabs.setTitle(`/deployments${data.path}`, data.title);
                                }}
                                onNavigateTop={(toPath) => {
                                    navigateTo(toPath);
                                }}
                                onNavigate={(toPath) => {
                                    const fullPath = `/deployments${toPath}`;
                                    if (location.pathname !== fullPath) {
                                        navigateTo(fullPath, { replace: true });
                                    }
                                }}
                            />
                        </Box>
                    );
                },
            },
            {
                path: 'settings',
                Component: () => {
                    // iframe to deployments microfrontend
                    const context = useKapetaContext();
                    const token = useAuthToken();

                    if (context.loading || token.loading) {
                        return <div>Loading...</div>;
                    }

                    return (
                        <iframe
                            src={`${window.KapetaDesktop.urls.settings}/${
                                context.activeContext?.identity.handle ?? ''
                            }?token=${token.value}`}
                            width="100%"
                            height="100%"
                        />
                    );
                },
            },
        ],
    },
]);

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
    <ThemeProvider theme={kapetaDark}>
        <RouterProvider router={router} />
    </ThemeProvider>
);
