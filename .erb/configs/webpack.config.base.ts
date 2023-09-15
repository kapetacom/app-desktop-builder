/* eslint-disable import/no-relative-packages */
/**
 * Base webpack config used across other specific configs
 */

import webpack from 'webpack';
import TsconfigPathsPlugins from 'tsconfig-paths-webpack-plugin';
import Path from "path";
import webpackPaths from './webpack.paths';
import { dependencies as externals } from '../../release/app/package.json';

const configuration: webpack.Configuration = {
    externals: [...Object.keys(externals || {})],

    stats: 'errors-only',

    parallelism: 20,

    output: {
        path: webpackPaths.srcPath,
        // https://github.com/webpack/webpack/issues/1114
        library: {
            type: 'commonjs2',
        },
    },

    /**
     * Determine the array of extensions that should be used to resolve modules.
     */
    resolve: {
        extensions: [
            '.js',
            '.jsx',
            '.json',
            '.ts',
            '.tsx',
            '.css',
            '.less',
            '.yml',
            '.yaml',
        ],
        alias: {
            'react': Path.resolve(webpackPaths.rootPath, './node_modules/react'),
            'mobx': Path.resolve(webpackPaths.rootPath, './node_modules/mobx'),
            'mobx-react': Path.resolve(webpackPaths.rootPath, './node_modules/mobx-react'),
            'react-dom': Path.resolve(webpackPaths.rootPath, './node_modules/react-dom'),
            'react-router-dom': Path.resolve(webpackPaths.rootPath, './node_modules/react-router-dom'),
            '@kapeta/ui-web-utils': Path.resolve(webpackPaths.rootPath, './node_modules/@kapeta/ui-web-utils'),
            '@kapeta/ui-web-types': Path.resolve(webpackPaths.rootPath, './node_modules/@kapeta/ui-web-types'),
            '@kapeta/ui-web-context': Path.resolve(webpackPaths.rootPath, './node_modules/@kapeta/ui-web-context'),
            '@kapeta/ui-web-components': Path.resolve(webpackPaths.rootPath, './node_modules/@kapeta/ui-web-components'),
            '@kapeta/ui-web-plan-editor': Path.resolve(webpackPaths.rootPath, './node_modules/@kapeta/ui-web-plan-editor'),
            '@mui/material': Path.resolve(webpackPaths.rootPath, './node_modules/@mui/material'),
            '@mui/icons-material': Path.resolve(webpackPaths.rootPath, './node_modules/@mui/icons-material'),
        },
        modules: [webpackPaths.srcPath, 'node_modules'],
        // There is no need to add aliases here, the paths in tsconfig get mirrored
        plugins: [new TsconfigPathsPlugins()],
        fallback: { path: require.resolve('path-browserify') },
    },

    plugins: [
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'production',
        }),
    ],
};

export default configuration;
