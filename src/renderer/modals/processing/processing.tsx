import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.less';

import {ProcessingContent} from "./ProcessingContent";
import {kapetaLight} from "../../Theme";
import {ThemeProvider} from "@mui/material";

const root = createRoot(document.getElementById('root')!);

interface State {
    text?: string;
    linkText?: string;
    link?: string;
}

function render(state:State) {

    root.render(
        <ThemeProvider theme={kapetaLight}>
            <ProcessingContent
                onLinkOpen={async (url) => {
                    window.open(url);
                }}
                text={state.text ?? null}
                linkText={state.linkText ?? null}
                link={state.link ?? null}
            />
        </ThemeProvider>
    );
}


window.electron.ipcRenderer.on('processing', ([eventType, data]) => {
    if (eventType === 'changed') {
        render(data as State);
    }
});


render({});
