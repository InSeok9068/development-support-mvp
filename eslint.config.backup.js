import eslintConfigPrettier from 'eslint-config-prettier/flat';
import oxlint from 'eslint-plugin-oxlint';
import eslintPluginVue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tslint from 'typescript-eslint';
import eslintPluginCustom from './eslint.plugin.custom.js';

export default defineConfig(
  { ignores: ['.history', '*.d.ts', 'apps/*/src/api/pocketbase*', 'apps/*/pb_hooks/types.d.ts'] },
  {
    extends: [...eslintPluginVue.configs['flat/recommended'], ...oxlint.configs['flat/recommended']],
    files: ['apps/*/src/**/*.vue', 'packages/src/**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        parser: tslint.parser,
      },
    },
    plugins: {
      'my-custom-rules': eslintPluginCustom,
    },
    rules: {
      // oxlint 이미 검사
      'vue/no-arrow-functions-in-watch': 'off',
      'vue/no-deprecated-destroyed-lifecycle': 'off',
      'vue/no-export-in-script-setup': 'off',
      'vue/no-lifecycle-after-await': 'off',
      'vue/prefer-import-from-vue': 'off',
      'vue/valid-define-emits': 'off',
      'vue/valid-define-props': 'off',
      'vue/no-multiple-slot-args': 'off',
      'vue/no-required-prop-with-default': 'off',

      // 프로젝트 특성상 꺼야 하는 규칙
      'vue/no-deprecated-slot-attribute': 'off', // shoelace
      'vue/multi-word-component-names': 'off', // unplugin-vue-router

      // oxlint 특성상 검사하기 어려운 규칙
      'my-custom-rules/no-shoelace-form-v-model': 'error',
      'my-custom-rules/no-native-form-tag-except-allowed': 'error',
      'my-custom-rules/prefer-shoelace-sl-change-handler-naming': 'warn',
    },
  },
  eslintConfigPrettier,
);
