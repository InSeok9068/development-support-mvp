import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginVue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tslint from 'typescript-eslint';
import eslintPluginCustom from './eslint.plugin.custom.js';

export default defineConfig(
  // 1. 글로벌 무시 설정 (가장 상단에 위치)
  {
    ignores: [
      '**/dist/**', // 빌드 결과물
      '**/build/**', // 빌드 결과물
      '**/.output/**', // Nuxt/Next 등 빌드 결과물
      '**/.history/**', // VSCode local history
      '**/*.d.ts', // 타입 정의 파일
      'apps/*/src/api/pocketbase*',
      'apps/*/pb_hooks/types.d.ts',
    ],
  },

  // 2. 공통 언어 및 베이스 규칙
  {
    files: ['**/*.{js,ts,vue}'],
    extends: [eslint.configs.recommended, ...tslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
    },
  },

  // 3. 브라우저 및 Vue 전용 설정
  {
    files: ['apps/*/src/**/*.{js,ts,vue}', 'packages/src/**/*.{js,ts,vue}'],
    extends: [...eslintPluginVue.configs['flat/recommended']],
    languageOptions: {
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        parser: tslint.parser,
      },
    },
    rules: {
      'vue/no-deprecated-slot-attribute': 'off', // shoelace
      'vue/multi-word-component-names': 'off', // unplugin-vue-router
    },
  },

  // 4. Pocketbase Hooks 전용 (CommonJS)
  {
    files: ['apps/*/pb_hooks/**/*.ts'],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  // 5. 커스텀 플러그인 등록
  {
    plugins: {
      'my-custom-rules': eslintPluginCustom,
    },
  },

  // 6. 앱 공통 금지 규칙
  {
    files: ['apps/*/src/**/*.{js,ts,vue}', 'packages/src/**/*.{js,ts,vue}'],
    rules: {
      'my-custom-rules/no-pocketbase-collection-literal': 'error',
      'my-custom-rules/no-query-key-collections-enum': 'error',
      'my-custom-rules/no-query-key-first-segment-domain': 'error',
    },
  },

  // 7. pages/components 전용 금지 규칙
  {
    files: ['apps/*/src/pages/**/*.{js,ts,vue}', 'apps/*/src/components/**/*.{js,ts,vue}'],
    rules: {
      'my-custom-rules/no-direct-pocketbase-sdk-call-in-page-component': 'error',
      'my-custom-rules/no-direct-tanstack-query-in-page-component': 'error',
      'my-custom-rules/no-direct-realtime-subscribe-in-page-component': 'error',
      'my-custom-rules/no-direct-shoelace-event-target-access': 'error',
    },
  },

  // 8. composables 전용 금지 규칙
  {
    files: ['apps/*/src/composables/**/*.{js,ts,vue}'],
    rules: {
      'my-custom-rules/no-composable-on-prefix-action-name': 'error',
      'my-custom-rules/no-composable-mutation-exposure': 'error',
      'my-custom-rules/no-composable-mutate-call': 'error',
      'my-custom-rules/no-composable-usemutation-destructure': 'error',
    },
  },

  // 9. pb_hooks 전용 금지/권장 규칙
  {
    files: ['apps/*/pb_hooks/**/*.ts'],
    rules: {
      'my-custom-rules/no-pb-hooks-esm-module': 'error',
      'my-custom-rules/no-pb-hooks-require-relative-path': 'error',
      'my-custom-rules/no-pb-hooks-runtime-dependency': 'error',
      'my-custom-rules/no-pb-hooks-filter-template-literal': 'error',
      'my-custom-rules/no-pb-hooks-router-auth-middleware': 'error',
      'my-custom-rules/prefer-pb-hooks-router-method-uppercase': 'warn',
      'my-custom-rules/prefer-pb-hooks-router-api-prefix': 'warn',
      'my-custom-rules/prefer-pb-hooks-http-timeout': 'warn',
    },
  },

  // 10. 앱 공통 권장 규칙
  {
    files: ['apps/*/src/**/*.{js,ts,vue}', 'packages/src/**/*.{js,ts,vue}'],
    rules: {
      'my-custom-rules/prefer-query-key-second-segment': 'warn',
      'my-custom-rules/prefer-detail-invalidation-query-key': 'warn',
      'my-custom-rules/prefer-shoelace-read-helper': 'warn',
    },
  },

  // 11. Vue template 전용 Shoelace 규칙
  {
    files: ['apps/*/src/**/*.vue', 'packages/src/**/*.vue'],
    rules: {
      'my-custom-rules/no-shoelace-form-v-model': 'error',
      'my-custom-rules/no-native-form-tag-except-allowed': 'error',
      'my-custom-rules/prefer-shoelace-sl-change-handler-naming': 'warn',
    },
  },

  // 12. Prettier (최종 스타일 덮어쓰기)
  eslintConfigPrettier,
);
