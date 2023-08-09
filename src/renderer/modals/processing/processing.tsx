import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.less';

import { ProcessingContent } from './ProcessingContent';
import { kapetaLight } from '../../Theme';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';

const root = createRoot(document.getElementById('root')!);

interface State {
    title?: string;
    text?: string;
    linkText?: string;
    link?: string;
}

function render(state: State) {
    root.render(
        <MemoryRouter>
            <CssBaseline />
            <ThemeProvider theme={kapetaLight}>
                <ProcessingContent
                    onLinkOpen={async (url) => {
                        window.open(url);
                    }}
                    title={state.title ?? null}
                    text={state.text ?? null}
                    linkText={state.linkText ?? null}
                    link={state.link ?? null}
                />
            </ThemeProvider>
        </MemoryRouter>
    );
}

window.electron.ipcRenderer.on('processing', ([eventType, data]) => {
    if (eventType === 'changed') {
        render(data as State);
    }
});

render({});
