import 'webpack-dev-server';
import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import chalk from 'chalk';
import { merge } from 'webpack-merge';
import { execSync, spawn } from 'child_process';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';
import checkNodeEnv from '../scripts/check-node-env';

// When an ESLint server is running, we can't set the NODE_ENV so we'll check if it's
// at the dev webpack config is not accidentally run in a production environment
if (process.env.NODE_ENV === 'production') {
    checkNodeEnv('development');
}

const port = process.env.PORT || 1212;
const manifest = path.resolve(webpackPaths.dllPath, 'renderer.json');
const skipDLLs =
    module.parent?.filename.includes('webpack.config.renderer.dev.dll') ||
    module.parent?.filename.includes('webpack.config.eslint');

const packageJson = require('../../package.json');

// We do this to ensure any linked dependencies uses the node modules from here
const alias: { [key: string]: string } = {};
Object.entries(packageJson.devDependencies).forEach(([key]) => {
    alias[key] = path.resolve(__dirname, `../../node_modules/${key}`);
});

/**
 * Warn if the DLL is not built
 */
if (
    !skipDLLs &&
    !(fs.existsSync(webpackPaths.dllPath) && fs.existsSync(manifest))
) {
    console.log(
        chalk.black.bgYellow.bold(
            'The DLL files are missing. Sit back while we build them for you with "npm run postinstall"'
        )
    );
    execSync('npm run postinstall');
}

const sentryPath = path.join(webpackPaths.srcRendererPath, 'sentry.ts');

const configuration: webpack.Configuration = {
    devtool: 'eval',

    mode: 'development',

    target: ['web', 'electron-renderer'],

    entry: {
        index: [
            `webpack-dev-server/client?http://localhost:${port}/dist`,
            'webpack/hot/only-dev-server',
            sentryPath,
            path.join(webpackPaths.srcRendererPath, 'index.tsx'),
        ],
        splash: [
            `webpack-dev-server/client?http://localhost:${port}/dist`,
            'webpack/hot/only-dev-server',
            path.join(webpackPaths.srcRendererPath, 'modals/splash/splash.tsx'),
        ],
        processing: [
            `webpack-dev-server/client?http://localhost:${port}/dist`,
            'webpack/hot/only-dev-server',
            path.join(webpackPaths.srcRendererPath, 'modals/processing/processing.tsx'),
        ],
    },

    output: {
        path: webpackPaths.distRendererPath,
        publicPath: '/',
        filename: '[name].dev.js',
        library: {
            type: 'umd',
        },
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                // exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        allowTsInNodeModules: true,
                        configFile: path.join(
                            webpackPaths.srcRendererPath,
                            'tsconfig.json'
                        ),
                    },
                },
            },
            {
                test: /\.s?(c|a)ss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: true,
                            importLoaders: 1,
                        },
                    },
                    'sass-loader',
                ],
                include: /\.module\.s?(c|a)ss$/,
            },
            {
                test: /\.s?css$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
                exclude: /\.module\.s?(c|a)ss$/,
            },
            {
                test: /\.less$/,
                use: ['style-loader', 'css-loader', 'less-loader'],
            },
            {
                test: /\.ya?ml$/,
                use: ['yaml-loader'],
            },
            // Fonts
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
            // Images
            {
                test: /\.(png|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            // SVG
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: '@svgr/webpack',
                        options: {
                            prettier: false,
                            svgo: false,
                            svgoConfig: {
                                plugins: [{ removeViewBox: false }],
                            },
                            titleProp: true,
                            ref: true,
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        ...(skipDLLs
            ? []
            : [
                  new webpack.DllReferencePlugin({
                      context: webpackPaths.dllPath,
                      manifest: require(manifest),
                      sourceType: 'var',
                  }),
              ]),

        new webpack.NoEmitOnErrorsPlugin(),

        /**
         * Create global constants which can be configured at compile time.
         *
         * Useful for allowing different behaviour between development builds and
         * release builds
         *
         * NODE_ENV should be production so that modules do not perform certain
         * development checks
         *
         * By default, use 'development' as NODE_ENV. This can be overriden with
         * 'staging', for example, by changing the ENV variables in the npm scripts
         */
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'development',
            RELEASE_VERSION: 'development',
        }),

        new webpack.LoaderOptionsPlugin({
            debug: true,
        }),

        new ReactRefreshWebpackPlugin(),

        new HtmlWebpackPlugin({
            filename: path.join('index.html'),
            chunks: ['index'],
            template: path.join(webpackPaths.srcRendererPath, 'index.ejs'),
            minify: {
                collapseWhitespace: true,
                removeAttributeQuotes: true,
                removeComments: true,
            },
            isBrowser: false,
            env: process.env.NODE_ENV,
            isDevelopment: process.env.NODE_ENV !== 'production',
            nodeModules: webpackPaths.appNodeModulesPath,
        }),

        new HtmlWebpackPlugin({
            filename: 'splash.html',
            chunks: ['splash'],
            template: path.join(webpackPaths.srcRendererPath, 'modals/modal.ejs'),
            minify: {
                collapseWhitespace: true,
                removeAttributeQuotes: true,
                removeComments: true,
            },
            isBrowser: false,
            isDevelopment: process.env.NODE_ENV !== 'production',
        }),

        new HtmlWebpackPlugin({
            filename: 'processing.html',
            chunks: ['processing'],
            template: path.join(webpackPaths.srcRendererPath, 'modals/modal.ejs'),
            minify: {
                collapseWhitespace: true,
                removeAttributeQuotes: true,
                removeComments: true,
            },
            isBrowser: false,
            isDevelopment: process.env.NODE_ENV !== 'production',
        }),
    ],
    resolve: {
        alias,
    },

    node: {
        __dirname: false,
        __filename: false,
    },

    devServer: {
        port,
        compress: true,
        hot: true,
        headers: { 'Access-Control-Allow-Origin': '*' },
        static: {
            publicPath: '/',
        },
        historyApiFallback: {
            verbose: true,
        },
        setupMiddlewares(middlewares) {
            console.log('Starting preload.js builder...');
            const preloadProcess = spawn('npm', ['run', 'start:preload'], {
                shell: true,
                stdio: 'inherit',
            })
                .on('close', (code: number) => process.exit(code!))
                .on('error', (spawnError) => console.error(spawnError));

            console.log('Starting Main Process...');
            let args = ['run', 'start:main'];
            if (process.env.MAIN_ARGS) {
                args = args.concat(
                    [
                        '--',
                        ...Array.from(
                            process.env.MAIN_ARGS.matchAll(/"[^"]+"|[^\s"]+/g)
                        ),
                    ].flat()
                );
            }
            spawn('npm', args, {
                shell: true,
                stdio: 'inherit',
            })
                .on('close', (code: number) => {
                    preloadProcess.kill();
                    process.exit(code!);
                })
                .on('error', (spawnError) => console.error(spawnError));
            return middlewares;
        },
    },
};

export default merge(baseConfig, configuration);
