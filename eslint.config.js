import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tslint from 'typescript-eslint';

export default tslint.config(
  { ignores: ['*.d.ts', 'apps/*/src/api/pocketbase*'] },
  {
    extends: [
      eslint.configs.recommended,
      ...tslint.configs.recommended,
      ...eslintPluginVue.configs['flat/recommended'],
    ],
    files: ['apps/*/src/**/*.{js,ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        parser: tslint.parser,
      },
    },
    rules: {
      'vue/require-v-for-key': 'off', // v-for
    },
  },
  {
    files: ['apps/*/src/pages/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off', // unplugin-vue-router
    },
  },
  eslintConfigPrettier,
);
