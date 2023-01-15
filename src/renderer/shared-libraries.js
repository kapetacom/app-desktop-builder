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
    '@blockware/ui-web-types': 'Blockware.Types',
    '@blockware/ui-web-utils': 'Blockware.Utils',
    '@blockware/ui-web-context': 'Blockware.Context',
    '@blockware/ui-web-components': 'Blockware.Components',
}

*/

window._ = require('lodash') ;

window.React = require('react');
window.ReactDOM = require('react-dom');
window.MobX = require('mobx');
window.MobXReact = require('mobx-react');

window.Blockware.Types = require('@blockware/ui-web-types');
window.Blockware.Utils = require('@blockware/ui-web-utils');
window.Blockware.Context = require('@blockware/ui-web-context');
window.Blockware.Components = require('@blockware/ui-web-components');
