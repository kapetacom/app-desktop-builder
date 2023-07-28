import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material';
import {
    RouterProvider,
    useParams,
    createMemoryRouter,
} from 'react-router-dom';
import { useEffect } from 'react';
import { PlannerService } from '@kapeta/ui-web-context';
import { useAsync, useAsyncFn } from 'react-use';
import { Root } from './Root';
import { kapetaDark } from './Theme';
import { initialise } from './context';
import { PlanView } from './views/PlanView';
import { PlanOverview } from './components/plan-overview/PlanOverview';
import { getToken } from './utils/tokenHelper';
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
                                <PlanOverview plans={planAssets.value || []} />
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
                    console.log('Loading deployments');
                    const context = useKapetaContext();
                    const token = useAsync(() => getToken());

                    if (context.loading || token.loading) {
                        return <div>Loading...</div>;
                    }

                    return (
                        <iframe
                            title="Deployments"
                            src={`https://web-deployments.kapeta.com/${context.activeContext?.identity.handle}?token=${token.value}`}
                            width="100%"
                            height="100%"
                        />
                    );
                },
            },
            {
                path: 'blockhub',
                Component: () => {
                    // iframe to blockhub/registry microfrontend
                    console.log('Loading blockhub');
                    const context = useKapetaContext();
                    const token = useAsync(() => getToken());

                    if (context.loading || token.loading) {
                        return <div>Loading...</div>;
                    }

                    return (
                        <iframe
                            title="Deployments"
                            src={`https://web-registry.kapeta.com/${context.activeContext?.identity.handle}?token=${token.value}`}
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
