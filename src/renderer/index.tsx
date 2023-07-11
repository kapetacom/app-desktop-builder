import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material';
import { RouterProvider, createHashRouter, useParams } from 'react-router-dom';
import { PlannerNodeSize } from '@kapeta/ui-web-plan-editor';
import { useEffect } from 'react';
import { IdentityService, PlannerService } from '@kapeta/ui-web-context';
import { useAsync, useAsyncFn } from 'react-use';
import { Root } from './Root';
import { theme } from './Theme';
import { initialise } from './context';
import { PlanView } from './views/PlanView';
import { PlanOverview } from './components/plan-overview/PlanOverview';

const router = createHashRouter([
    {
        basePath: '/',
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
                                <PlanOverview
                                    plans={planAssets.value || []}
                                    size={PlannerNodeSize.MEDIUM}
                                />
                            );
                        },
                    },
                    {
                        path: ':systemId',
                        Component: (props) => {
                            const params = useParams();
                            return <PlanView systemId={params.systemId} />;
                        },
                    },
                ],
            },
            {
                path: 'deployments',
                Component: () => {
                    // iframe to deployments microfrontend
                    console.log('Loading deployments');
                    const identity = useAsync(() =>
                        IdentityService.getCurrent()
                    );

                    if (identity.loading) {
                        return <div>Loading...</div>;
                    }

                    return (
                        <iframe
                            src={`https://web-deployments.kapeta.com/${identity.value}?token=`}
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
    <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
    </ThemeProvider>
);
