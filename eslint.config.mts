import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import stylistic from '@stylistic/eslint-plugin'

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    {
        files: ['*.vue', '**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
            },
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            'vue/no-v-html': 'off',
            'no-undef': 'off', // TypeScript handles this
        }
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            '@stylistic': stylistic
        },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    'argsIgnorePattern': '^_',
                    'varsIgnorePattern': '^_',
                    'caughtErrorsIgnorePattern': '^_'
                }
            ],

            /* base */
            '@stylistic/indent': ['error', 4, { 'SwitchCase': 1 }],
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/semi': ['error', 'never'],

            /* space */
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/no-multi-spaces': 'error',
            '@stylistic/keyword-spacing': ['error', { 'before': true, 'after': true }],
            '@stylistic/space-before-blocks': 'error',
            '@stylistic/space-infix-ops': 'error',
            /* variable */
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/array-bracket-spacing': ['error', 'never'],
            '@stylistic/comma-spacing': ['error', { 'before': false, 'after': true }],
            '@stylistic/key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
            /* function */
            '@stylistic/space-before-function-paren': ['error', {
                'anonymous': 'always',
                'named': 'never',
                'asyncArrow': 'always'
            }],
            '@stylistic/arrow-parens': ['error', 'as-needed'],
            '@stylistic/arrow-spacing': ['error', { 'before': true, 'after': true }],
        },
    },
]
