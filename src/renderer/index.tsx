import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material';
import {
    RouterProvider,
    useParams,
    createMemoryRouter,
    useNavigate,
} from 'react-router-dom';
import { useEffect } from 'react';
import {AssetService, PlannerService} from '@kapeta/ui-web-context';
import { useAsyncFn } from 'react-use';
import { Root } from './Root';
import { kapetaDark } from './Theme';
import { initialise } from './context';
import { PlanView } from './views/PlanView';
import { PlanOverview } from './components/plan-overview/PlanOverview';
import { useAuthToken } from './utils/tokenHelper';
import { KapetaContextProvider, useKapetaContext } from './hooks/contextHook';

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
                            let [planAssets, reloadPlans] =
                                useAsyncFn(async () => {
                                    console.log('Loading plans');
                                    try {
                                        return await PlannerService.list();
                                    } catch (e: any) {
                                        console.log('Failed to load plans', e);
                                        throw e;
                                    }
                                }, []);

                            useEffect(() => {
                                reloadPlans();
                            }, [reloadPlans]);

                            return (
                                <PlanOverview
                                    assetService={AssetService}
                                    onPlanAdded={(plan) => {
                                        navigateTo(`/edit/${encodeURIComponent(plan.ref)}`);
                                    }}

                                    onPlanSelected={(plan) => {
                                        navigateTo(`/edit/${encodeURIComponent(plan.ref)}`);
                                    }}

                                    plans={planAssets.value || []} />
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
                path: 'deployments',
                Component: () => {
                    // iframe to deployments microfrontend
                    const context = useKapetaContext();
                    const token = useAuthToken();

                    if (context.loading || token.loading) {
                        return <div>Loading...</div>;
                    }

                    return (
                        <iframe
                            src={`${window.KapetaDesktop.urls.deployments}/${context.activeContext?.identity.handle}?token=${token.value}`}
                            width="100%"
                            height="100%"
                        />
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
                            src={`${window.KapetaDesktop.urls.settings}/${context.activeContext?.identity.handle ?? ''}?token=${token.value}`}
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
        <KapetaContextProvider>
            <RouterProvider router={router} />
        </KapetaContextProvider>
    </ThemeProvider>
);
