import './index.less';

import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { kapetaDark } from '../src/renderer/Theme';
import { TopBar } from '../src/renderer/components/shell/TopBar';

export default {
    title: 'Top bar',
};

export const ProgressNotifications = () => {
    return (
        <ThemeProvider theme={kapetaDark}>
            <MemoryRouter>
                <TopBar
                    notifications={[
                        {
                            id: '1',
                            read: false,
                            message: 'Pulling image: kapeta/something:1.2.3',
                            type: 'progress',
                            timestamp: Date.now(),
                            progress: 80,
                        },
                        {
                            id: '2',
                            read: false,
                            message: 'Pulled image: hofmeister/other:2.2.0',
                            type: 'progress',
                            timestamp: Date.now(),
                            progress: 100,
                        },
                        {
                            id: '3',
                            read: false,
                            message: 'Pulling image: kapeta/other:2.2.0',
                            type: 'progress',
                            timestamp: Date.now(),
                            progress: 50,
                        },
                        {
                            id: '4',
                            read: false,
                            message: 'Something good happened!',
                            type: 'success',
                            timestamp: Date.now(),
                        },
                        {
                            id: '3',
                            read: false,
                            message: 'Starting plan...',
                            type: 'progress',
                            timestamp: Date.now(),
                            progress: -1,
                        },
                    ]}
                />
            </MemoryRouter>
        </ThemeProvider>
    );
};

export const SimpleNotifications = () => {
    return (
        <ThemeProvider theme={kapetaDark}>
            <MemoryRouter>
                <TopBar
                    notifications={[
                        {
                            id: '1',
                            message: 'Something went wrong!',
                            type: 'warning',
                            timestamp: Date.now(),
                            read: false,
                        },
                        {
                            id: '2',
                            message: 'Something failed bad!',
                            type: 'error',
                            timestamp: Date.now(),
                            read: false,
                        },
                        {
                            id: '3',
                            message: 'Something good happened!',
                            type: 'success',
                            timestamp: Date.now(),
                            read: false,
                        },
                        {
                            id: '4',
                            message: 'The info is here!',
                            type: 'info',
                            timestamp: Date.now(),
                            read: false,
                        },
                        {
                            id: '5',
                            message: 'Some commment?',
                            type: 'comment',
                            timestamp: Date.now(),
                            read: false,
                            author: {
                                handle: 'wejendorp',
                                name: 'Jacob Wejendorp',
                            },
                        },
                    ]}
                />
            </MemoryRouter>
        </ThemeProvider>
    );
};

export const EmptyState = () => {
    return (
        <ThemeProvider theme={kapetaDark}>
            <MemoryRouter>
                <TopBar />
            </MemoryRouter>
        </ThemeProvider>
    );
};
