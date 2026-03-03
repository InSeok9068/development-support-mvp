import eslintConfigPrettier from 'eslint-config-prettier/flat';
import oxlint from 'eslint-plugin-oxlint';
import eslintPluginVue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tslint from 'typescript-eslint';

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
    rules: {
      'vue/no-arrow-functions-in-watch': 'off',
      'vue/no-deprecated-destroyed-lifecycle': 'off',
      'vue/no-export-in-script-setup': 'off',
      'vue/no-lifecycle-after-await': 'off',
      'vue/prefer-import-from-vue': 'off',
      'vue/valid-define-emits': 'off',
      'vue/valid-define-props': 'off',
      'vue/no-multiple-slot-args': 'off',
      'vue/no-required-prop-with-default': 'off',
      'vue/no-deprecated-slot-attribute': 'off', // shoelace
      'vue/multi-word-component-names': 'off', // unplugin-vue-router
      'vue/no-restricted-syntax': [
        'error',
        {
          selector: "VElement[name='sl-select'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
          message: '[금지] sl-select에서는 v-model 대신 :value + @sl-change를 사용하세요.',
        },
        {
          selector: "VElement[name='sl-checkbox'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
          message: '[금지] sl-checkbox에서는 v-model 대신 :checked + @sl-change를 사용하세요.',
        },
        {
          selector: "VElement[name='sl-switch'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
          message: '[금지] sl-switch에서는 v-model 대신 :checked + @sl-change를 사용하세요.',
        },
        {
          selector: "VElement[name='sl-radio-group'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
          message: '[금지] sl-radio-group에서는 v-model 대신 :value + @sl-change를 사용하세요.',
        },
        {
          selector: "VElement[name='button']",
          message: '[금지] 네이티브 <button> 대신 <sl-button>을 사용하세요.',
        },
        {
          selector: "VElement[name='select']",
          message: '[금지] 네이티브 <select> 대신 <sl-select>를 사용하세요.',
        },
        {
          selector: "VElement[name='textarea']",
          message: '[금지] 네이티브 <textarea> 대신 <sl-textarea>를 사용하세요.',
        },
        {
          selector:
            "VElement[name='input']:not(:has(VAttribute[key.name='type'][value.value='file'])):not(:has(VAttribute[key.name='type'][value.value='text']):has(VAttribute[key.name='hidden']))",
          message: "[금지] 네이티브 <input>은 type='file' 또는 type='text' hidden 예외 외 사용을 금지합니다.",
        },
      ],
    },
  },
  eslintConfigPrettier,
);
