import eslint from '@eslint/js';
import tslint from 'typescript-eslint';
import eslintPluginVue from 'eslint-plugin-vue';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';

export default tslint.config(
  { ignores: ['*.d.ts', 'src/api/pocketbase*'] },
  {
    extends: [
      eslint.configs.recommended,
      ...tslint.configs.recommended,
      ...eslintPluginVue.configs['flat/recommended'],
    ],
    files: ['src/**/*.{js,ts,vue}'],
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
    files: ['src/pages/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off', // unplugin-vue-router
    },
  },
  eslintConfigPrettier,
);
