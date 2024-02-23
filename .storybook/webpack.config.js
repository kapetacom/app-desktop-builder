const TsconfigPathsPlugins = require('tsconfig-paths-webpack-plugin');

module.exports = ({ config }) => {
    config.module.rules = [
        {
            test: /\.tsx?$/,
            // exclude: /node_modules/,
            use: {
                loader: 'ts-loader',
                options: {
                    // Remove this line to enable type checking in webpack builds
                    transpileOnly: true,
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
    ];
    config.resolve.extensions.push('.svg', '.png');

    // Add support for TypeScript paths
    config.resolve.plugins = config.resolve.plugins || [];
    config.resolve.plugins.push(new TsconfigPathsPlugins());

    config.resolve.alias = config.resolve.alias || {};

    // TODO: Hacky workaround for the double node_modules in this repo
    // The following packages have had issues when resolved to different instances of the same package
    const forceResolutions = ['@kapeta/ui-web-components', '@mui/material'];
    forceResolutions.forEach((pkg) => {
        config.resolve.alias[pkg] = require.resolve(`${pkg}/package.json`).replace('/package.json', '');
    });

    return config;
};
