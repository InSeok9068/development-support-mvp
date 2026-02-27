import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginVue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tslint from 'typescript-eslint';
import eslintCustomRuleConfig from './eslint.custom.rule.js';

export default defineConfig(
  { ignores: ['.history', '*.d.ts', 'apps/*/src/api/pocketbase*', 'apps/*/pb_hooks/types.d.ts'] },
  {
    extends: [
      eslint.configs.recommended,
      ...tslint.configs.recommended,
      ...eslintPluginVue.configs['flat/recommended'],
    ],
    files: ['apps/*/src/**/*.{js,ts,vue}', 'packages/src/**/*.{js,ts,vue}', 'apps/*/pb_hooks/**/*.pb.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        parser: tslint.parser,
      },
    },
  },
  {
    files: ['apps/*/pb_hooks/**/*.pb.ts'],
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  ...eslintCustomRuleConfig,
  {
    files: ['apps/*/src/**/*.vue', 'packages/src/**/*.vue'],
    rules: {
      'vue/no-deprecated-slot-attribute': 'off', // shoelace
      'vue/multi-word-component-names': 'off', // unplugin-vue-router
    },
  },
  eslintConfigPrettier,
);
