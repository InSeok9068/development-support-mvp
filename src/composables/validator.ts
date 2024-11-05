import { ref } from 'vue';

export const useValidator = () => {
  interface Validator {
    key: string;
    isValid?: boolean;
    valid: (value: string | number) => boolean;
    message?: string;
  }

  /* ======================= 변수 ======================= */
  const validators = ref<{
    schema: Validator[];
    invalid: (key: string) => boolean | undefined;
    getMessage: (key: string) => string;
    showMessage: (key: string) => boolean;
    valid: (key: string, value: string | number) => void;
    validAll: (formId: string) => boolean;
  }>({
    schema: [],
    invalid: function (key) {
      const validator = this.schema.find((value) => value.key === key);
      if (validator && validator.isValid !== undefined) {
        return !validator.isValid;
      } else {
        return undefined;
      }
    },
    getMessage: function (key) {
      const validator = this.schema.find((value) => value.key === key);
      return validator?.message ?? '입력값이 올바르지 않습니다.';
    },
    showMessage: function (key) {
      return this.invalid(key) ?? false;
    },
    valid: function (key, value) {
      const validator = this.schema.find((value) => value.key === key);
      if (validator) {
        validator.isValid = validator.valid(value);
      }
    },
    validAll: function (formId: string) {
      const form = document.forms.namedItem(formId)!;
      const inputs = form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select');
      const inputsFilter = [] as (HTMLInputElement | HTMLSelectElement)[];
      inputs.forEach((input) => {
        if (!['submit', 'button'].includes(input.type)) {
          inputsFilter.push(input);
        }
      });
      let isValidAll = true;
      for (let i = 0; i < inputsFilter.length; i++) {
        const input = inputsFilter.at(i)!;
        const validator = this.schema.find((value) => value.key === input.name)!;
        validator.isValid = validator.valid(input.value);
        if (!validator.isValid) {
          isValidAll = false;
          break;
        }
      }
      return isValidAll;
    },
  });
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  /* ======================= 메서드 ======================= */

  return {
    validators,
  };
};
