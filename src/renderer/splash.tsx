import { createRoot } from 'react-dom/client';
import { Checkbox, LoaderType, SimpleLoader } from '@kapeta/ui-web-components';
import { StatusCheck } from '../main/SplashScreenStatus';

const root = createRoot(document.getElementById('root')!);

function StatusIcon(props) {
    return {
        [StatusCheck.LOADING]: <Checkbox />,
        [StatusCheck.OK]: <Checkbox value />,
        [StatusCheck.ERROR]: <>❌</>,
    }[props.status];
}

function render() {
    const keyValuePairs = new URLSearchParams(
        window.location.hash.substring(1)
    );
    // TODO: Make this a kapeta logo loader
    const element = (
        <div>
            <SimpleLoader
                loading
                type={LoaderType.HOURGLASS}
                text={keyValuePairs.get('text') || 'Loading...'}
            />
            <ul style={{ padding: '0 30px 20px', listStyleType: 'none' }}>
                <li>
                    <StatusIcon status={keyValuePairs.get('docker')} /> Checking
                    Docker...
                </li>
                <li>
                    <StatusIcon status={keyValuePairs.get('cluster')} />{' '}
                    Starting local cluster...
                </li>
            </ul>
        </div>
    );

    root.render(element);
}

// Allow updating the loading text by changing the hash
window.addEventListener('popstate', (location) => {
    render();
});

render();
