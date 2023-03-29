/*

Shared libraries to avoid all components pulling in the same code - and also to ensure state and versions
across components.

Add the following externals to your webpack configuration to use these libraries:
externals: {
    'lodash': '_',
    'react': 'React',
    'react-dom': 'ReactDOM',
    'mobx': 'MobX',
    'mobx-react': 'MobXReact',
    '@kapeta/ui-web-types': 'Kapeta.Types',
    '@kapeta/ui-web-utils': 'Kapeta.Utils',
    '@kapeta/ui-web-context': 'Kapeta.Context',
    '@kapeta/ui-web-components': 'Kapeta.Components',
}

*/

window._ = require('lodash');

window.React = require('react');
window.ReactDOM = require('react-dom');
window.MobX = require('mobx');
window.MobXReact = require('mobx-react');

window.Kapeta.Types = require('@kapeta/ui-web-types');
window.Kapeta.Utils = require('@kapeta/ui-web-utils');
window.Kapeta.Context = require('@kapeta/ui-web-context');
window.Kapeta.Components = require('@kapeta/ui-web-components');
