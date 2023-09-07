/* Initialise contexts */
import Kapeta from './kapeta';

export async function initialise() {
    const start = Date.now();
    console.log('Loading %s plugins...', Kapeta.paths.length);
    for (let i = 0; i < Kapeta.paths.length; i++) {
        const scriptElm = document.createElement('script');
        scriptElm.setAttribute('src', Kapeta.paths[i]);
        const loaderPromise = new Promise((resolve) => {
            scriptElm.addEventListener('load', resolve);
            scriptElm.addEventListener('error', resolve);
        });
        document.body.appendChild(scriptElm);
        // eslint-disable-next-line no-await-in-loop
        await loaderPromise;
    }

    console.log('All plugins loaded in %s ms', Date.now() - start);
    return Kapeta.paths;
}
