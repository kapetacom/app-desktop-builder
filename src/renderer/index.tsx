import { createRoot } from 'react-dom/client';
import { Box, ThemeProvider } from '@mui/material';
import { RouterProvider, useParams, createMemoryRouter, useNavigate, useLocation } from 'react-router-dom';
import { Root } from './Root';
import { kapetaDark, kapetaLight } from './Theme';
import { initialise } from './context';
import { PlanView } from './views/PlanView';
import { PlanOverview } from './components/plan-overview/PlanOverview';
import { usePlans } from './hooks/assetHooks';
import { SimpleLoader } from '@kapeta/ui-web-components';
import { RemoteFrame } from './components/shell/RemoteFrame';
import { useKapetaContext } from './hooks/contextHook';
import { AssetService } from './api/AssetService';

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
                            const context = useKapetaContext();

                            const samplePlanName = `${context.profile?.handle}/sample-nodejs-plan`;

                            return (
                                <SimpleLoader loading={plans.loading || context.loading}>
                                    <PlanOverview
                                        assetService={AssetService}
                                        samplePlanName={samplePlanName}
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

                    let { '*': path } = useParams();
                    while (path && path.startsWith('/')) {
                        path = path.substr(1);
                    }
                    path = 'deployments' + (path ? '/' + path : '');

                    return <RemoteFrame baseUrl={window.KapetaDesktop.urls.deployments} path={path} />;
                },
            },
            {
                path: 'settings/*',
                Component: () => {
                    let { '*': path } = useParams();
                    return (
                        <RemoteFrame
                            baseUrl={window.KapetaDesktop.urls.settings}
                            path={`settings/${path ?? 'general'}`}
                        />
                    );
                },
            },
            {
                path: 'organizations/:handle/*',
                Component: () => {
                    const { handle: handle } = useParams();
                    let { '*': path } = useParams();
                    return (
                        <RemoteFrame
                            baseUrl={window.KapetaDesktop.urls.settings}
                            path={`organizations/${handle}${path ? '/' + path : '/settings/general'}`}
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
    <ThemeProvider theme={kapetaLight}>
        <RouterProvider router={router} />
    </ThemeProvider>
);
