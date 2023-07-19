import React from 'react';
import { createRoot } from 'react-dom/client';
import './processing.less';
import { shell } from 'electron';

const root = createRoot(document.getElementById('root')!);

interface Props {
    text: string | null;
    linkText: string | null;
    link: string | null;
}

export const ProcessingContent = (props: Props) => {
    return (
        <div className="modal-processing">
            <a className={'btn-close'} onClick={() => window.close()}>
                <i className={'fa fa-times'} />
            </a>
            <h2>Please wait...</h2>
            {props.text && <p>{props.text}</p>}
            {props.link && (
                <a
                    href={props.link}
                    onClick={(evt) => {
                        evt.preventDefault();
                        if (props.link) {
                            shell.openExternal(props.link);
                        }
                    }}
                >
                    {props.linkText ?? 'Click here to open in your browser.'}
                </a>
            )}
        </div>
    );
};

function render() {
    const keyValuePairs = new URLSearchParams(
        window.location.hash.substring(1)
    );

    root.render(
        <ProcessingContent
            text={keyValuePairs.get('text')}
            linkText={keyValuePairs.get('linkText')}
            link={keyValuePairs.get('link')}
        />
    );
}

// Allow updating the loading text by changing the hash
window.addEventListener('popstate', () => {
    render();
});

render();
