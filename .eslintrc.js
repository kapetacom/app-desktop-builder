module.exports = {
    extends: ['erb', 'plugin:@typescript-eslint/recommended'],
    rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-shadow': 'error',
        'no-shadow': 'off',
        // A temporary hack related to IDE not resolving correct package.json
        'import/no-extraneous-dependencies': 'off',
        'import/no-unresolved': 'error',
        'import/extensions': 'off',
        // Definitely disagree w/ this rule, default exports are :(
        'import/prefer-default-export': 'off',
        // Since React 17 and typescript 4.1 you can safely disable the rule
        'react/react-in-jsx-scope': 'off',
        'react/destructuring-assignment': 'off',
        'react/require-default-props': 'off',
        'react/function-component-definition': 'off',
        'react/sort-comp': 'off',
        'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.jsx'] }],
        'react/jsx-props-no-spreading': 'off',
        'react/no-unused-prop-types': 'warn',
        'react/prop-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'compat/compat': 'off',
        // Override airbnb rule
        // Labels for inputs can either be with `<label htmlFor={...}>` and ids,
        // or via nesting <label><input/></label>
        'jsx-a11y/label-has-associated-control': [
            'error',
            {
                labelComponents: ['label'],
                labelAttributes: [],
                controlComponents: ['input', 'select', 'textarea'],
                assert: 'either',
                depth: 25,
            },
        ],
        'class-methods-use-this': 'off',
        'no-await-in-loop': 'off',
        'no-console': 'off',
        'no-plusplus': 'off',
        'no-multi-assign': 'off',
        'no-underscore-dangle': 'off',
        'no-continue': 'off',
        'no-unused-expressions': 'off',
        'no-unused-vars': 'off',
        'no-use-before-define': 'off',
        'prefer-const': 'off',
        'prefer-destructuring': 'off',
        'default-case': 'off',
    },
    overrides: [
        {
            files: '.erb/**',
            rules: {
                '@typescript-eslint/no-var-requires': 'off',
                'import/no-import-module-exports': 'off',
            },
        },
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        createDefaultProgram: true,
    },
    settings: {
        'import/resolver': {
            // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
            node: {},
            webpack: {
                config: require.resolve(
                    './.erb/configs/webpack.config.eslint.ts'
                ),
            },
            typescript: {},
        },
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
    },
};
