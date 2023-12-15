module.exports = {
    stories: ['../stories/**/*.stories.tsx', '../stories/*.stories.tsx', '../stories/*.stories.js'],
    core: {
        builder: 'webpack5',
    },
    webpackFinal: async (config, { configType }) => {
        // Alias to prevent clashing with the react-router version in the release folder
        // router context does not work when loading two different packages of react-router
        config.resolve.alias = {
            ...config.resolve.alias,
            'react-router': require.resolve('react-router'),
            'react-router-dom': require.resolve('react-router-dom'),
        };

        return config;
    },
};
