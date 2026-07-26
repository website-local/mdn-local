import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  ...typescriptEslint.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.node,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
      },

      ecmaVersion: 2020,
      sourceType: 'commonjs',
    },

    rules: {
      indent: ['error', 2],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'require-atomic-updates': [0],
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-require-imports': [0],
    },
  },
];
