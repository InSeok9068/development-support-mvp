import eslint from '@eslint/js';
import eslintCustomRuleConfig from './eslint.custom.rule.js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginVue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['*.d.ts', 'apps/*/src/api/pocketbase*'] },
  {
    extends: [
      eslint.configs.recommended,
      ...tslint.configs.recommended,
      ...eslintPluginVue.configs['flat/recommended'],
    ],
    files: ['apps/*/src/**/*.{js,ts,vue}', 'packages/src/**/*.{js,ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        parser: tslint.parser,
      },
    },
  },
  ...eslintCustomRuleConfig,
  {
    files: ['apps/*/src/pages/**/*.vue', 'packages/src/**/*.vue'],
    rules: {
      'vue/no-deprecated-slot-attribute': 'off', // shoelace
      'vue/multi-word-component-names': 'off', // unplugin-vue-router
    },
  },
  eslintConfigPrettier,
);
