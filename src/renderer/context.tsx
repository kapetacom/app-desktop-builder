/* Initialise contexts */
import Blockware from './blockware';
import {
    ResourceTypeProvider,
    BlockTypeProvider,
    BlockTargetProvider} from "@blockware/ui-web-context";
import {} from "@blockware/ui-web-context";
import _ from 'lodash';


export async function initialise() {
    const start = Date.now();
    console.log('Loading %s plugins...', Blockware.paths.length)
    for(let i = 0; i < Blockware.paths.length; i++) {
        const scriptElm = document.createElement('script');
        scriptElm.setAttribute('src', Blockware.paths[i]);
        const loaderPromise = new Promise((resolve) => {
            scriptElm.addEventListener('load', resolve);
            scriptElm.addEventListener('error', resolve);
        })
        document.body.appendChild(scriptElm);
        await loaderPromise;
    }

    console.log('All plugins loaded in %s ms', Date.now() - start);

    function getVersion(id:string) {
        return id.split(':')[1];
    }

    _.forEach(Blockware.resourceTypes, (provider, id) => {
        if (!provider.version) {
            provider.version = getVersion(id);
        }
        console.log('Registering resource type with version %s', provider.version, provider);
        ResourceTypeProvider.register(provider);
    });

    _.forEach(Blockware.blockTypes, (provider, id) => {
        if (!provider.version) {
            provider.version = getVersion(id);
        }
        console.log('Registering block type with version %s', provider.version, provider);
        BlockTypeProvider.register(provider);
    });

    _.forEach(Blockware.languageTargets, (provider, id) => {
        if (!provider.version) {
            provider.version = getVersion(id);
        }
        console.log('Registering language target with version %s', provider.version, provider);
        BlockTargetProvider.register(provider);
    });
}



