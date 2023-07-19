import React from 'react';
import { createRoot } from 'react-dom/client';
import { Checkbox, LoaderType, SimpleLoader } from '@kapeta/ui-web-components';
import './splash.less';

const root = createRoot(document.getElementById('root')!);

export enum SplashStatusCheck {
    LOADING = 'LOADING',
    OK = 'OK',
    ERROR = 'ERROR',
}

export const SplashStatusIcon = (props: {
    status: SplashStatusCheck | null;
}) => {
    if (!props.status) {
        return null;
    }
    return {
        [SplashStatusCheck.LOADING]: <Checkbox />,
        [SplashStatusCheck.OK]: <Checkbox value />,
        [SplashStatusCheck.ERROR]: <>❌</>,
    }[props.status];
};

interface Props {
    text?: string | null;
    localClusterStatus: SplashStatusCheck | null;
    dockerStatus: SplashStatusCheck | null;
}

export const SplashContent = (props: Props) => {
    return (
        <div className="splash-content">
            <SimpleLoader
                loading
                type={LoaderType.HOURGLASS}
                text={props.text || 'Loading...'}
            />
            <ul style={{ padding: '0 30px 20px', listStyleType: 'none' }}>
                <li>
                    <SplashStatusIcon status={props.localClusterStatus} />{' '}
                    Starting local cluster...
                </li>
                <li>
                    <SplashStatusIcon status={props.dockerStatus} /> Checking
                    Docker...
                </li>
            </ul>
        </div>
    );
};

function render() {
    const keyValuePairs = new URLSearchParams(
        window.location.hash.substring(1)
    );

    root.render(
        <SplashContent
            text={keyValuePairs.get('text')}
            localClusterStatus={
                keyValuePairs.get('cluster') as SplashStatusCheck
            }
            dockerStatus={keyValuePairs.get('docker') as SplashStatusCheck}
        />
    );
}

// Allow updating the loading text by changing the hash
window.addEventListener('popstate', (location) => {
    render();
});

render();
