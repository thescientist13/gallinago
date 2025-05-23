import js from '@eslint/js';
import globals from 'globals';
import noOnlyTests from 'eslint-plugin-no-only-tests';

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
        ...globals.mocha,
        ...globals.chai,
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // turn this off for Prettier
      'no-irregular-whitespace': 'off',
      'no-only-tests/no-only-tests': 'error',
    },
    plugins: {
      'no-only-tests': noOnlyTests,
    },
  },
];