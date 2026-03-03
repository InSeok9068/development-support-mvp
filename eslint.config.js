import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginVue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tslint from 'typescript-eslint';
import eslintCustomRuleConfig from './eslint.custom.rule.js';

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

  // 5. 커스텀 룰 적용
  ...eslintCustomRuleConfig,

  // 6. Prettier (최종 스타일 덮어쓰기)
  eslintConfigPrettier,
);
