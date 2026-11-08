import js from '@eslint/js';
import globals from 'globals';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    // https://github.com/eslint/eslint/discussions/18304#discussioncomment-9069706
    ignores: [
      'node_modules/*',
      'dist/*',
      'coverage/*',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        requireConfigFile: false,
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // turn this off for Prettier
      'no-irregular-whitespace': 'off',
      'no-only-tests/no-only-tests': 'error',
      'import/enforce-node-protocol-usage': ['error', 'always'],
      // prefix-only built-ins are not recognized by enforce-node-protocol-usage
      // https://github.com/import-js/eslint-plugin-import/issues/2603
      'no-restricted-imports': ['error', {
        paths: ['test', 'test/reporters', 'sqlite', 'sea'].map(name => ({
          name,
          message: `Use 'node:${name}' for the Node.js built-in module.`,
        })),
      }],
    },
    plugins: {
      'no-only-tests': noOnlyTests,
      import: importPlugin,
    },
  },
];
