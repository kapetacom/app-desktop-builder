module.exports = {
    extends: ['erb', 'plugin:@typescript-eslint/recommended'],
    rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
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
        'import/order': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        'react/jsx-curly-brace-presence': 'off',
        'react-hooks/rules-of-hooks': 'off',
        'no-return-assign': 'off',
        'no-nested-ternary': 'off',
        'prefer-template': 'warn',
        'react/self-closing-comp': 'off',
        'spaced-comment': 'off',
        'no-lonely-if': 'off',
        'react/no-unused-prop-types': 'off',
        'no-param-reassign': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        'no-useless-escape': 'off',
        '@typescript-eslint/no-shadow': 'off',
        'no-return-await': 'off',
        'react/jsx-boolean-value': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        'one-var': 'off',

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
                config: require.resolve('./.erb/configs/webpack.config.eslint.ts'),
            },
            typescript: {},
        },
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
    },
};
