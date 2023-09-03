import React from 'react';
import './shared-libraries';
import { Provider } from 'mobx-react';
import { DefaultContext, SimpleLoader, DesktopContainer } from '@kapeta/ui-web-components';
import { Await, useAsyncError, useLoaderData } from 'react-router-dom';
import { Shell } from './views/Shell';
import { KapetaContextProvider } from './hooks/contextHook';
import { taskGetter } from './utils/taskGetter';
import './index.less';

const ErrorContainer = () => {
    const error = useAsyncError() as Error;
    return <pre>{error.message}</pre>;
};

export const Root = () => {
    const data = useLoaderData();
    // TODO: Remove this mobx provider
    return (
        <DesktopContainer version={window.KapetaDesktop.version} taskGetter={taskGetter}>
            <DefaultContext>
                <KapetaContextProvider>
                    <Provider>
                        <React.Suspense fallback={<SimpleLoader text="Initialising application..." loading />}>
                            <Await resolve={data} errorElement={<ErrorContainer />}>
                                <Shell key="main" />
                            </Await>
                        </React.Suspense>
                    </Provider>
                </KapetaContextProvider>
            </DefaultContext>
        </DesktopContainer>
    );
};
