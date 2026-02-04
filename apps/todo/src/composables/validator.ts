import { ref } from 'vue';

type ValidatorValue = string | number | boolean | null | undefined;

interface ValidatorRule<TKey extends string> {
  key: TKey;
  isValid?: boolean;
  validate: (value: ValidatorValue) => boolean;
  message?: string;
}

export const useValidator = <TKey extends string>(initialSchema: ValidatorRule<TKey>[] = []) => {
  const defaultMessage = '입력값이 올바르지 않습니다.';

  /* ======================= 변수 ======================= */
  const schema = ref<ValidatorRule<TKey>[]>([...initialSchema]);
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const findRule = (key: TKey) => {
    return schema.value.find((rule) => rule.key === key);
  };

  const invalid = (key: TKey) => {
    const rule = findRule(key);
    if (!rule || rule.isValid === undefined) {
      return undefined;
    }

    return !rule.isValid;
  };

  const message = (key: TKey) => {
    const rule = findRule(key);
    return rule?.message ?? defaultMessage;
  };

  const show = (key: TKey) => {
    return invalid(key) ?? false;
  };

  const validateField = (key: TKey, value: ValidatorValue) => {
    const rule = findRule(key);
    if (!rule) {
      console.warn(`[useValidator] key "${key}"에 대한 validator schema가 없습니다.`);
      return false;
    }

    rule.isValid = rule.validate(value);
    return rule.isValid;
  };

  const validateForm = (formId: string) => {
    const form = document.forms.namedItem(formId);
    if (!form) {
      console.warn(`[useValidator] id "${formId}" form을 찾지 못했습니다.`);
      return false;
    }

    const inputs = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea',
    );
    const filteredInputs = [] as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];
    inputs.forEach((input) => {
      if (!['submit', 'button', 'reset'].includes(input.type)) {
        filteredInputs.push(input);
      }
    });

    let isValidAll = true;
    for (let i = 0; i < filteredInputs.length; i++) {
      const input = filteredInputs[i]!;
      if (!input.name) {
        continue;
      }

      const key = input.name as TKey;
      const rule = findRule(key);
      if (!rule) {
        continue;
      }

      rule.isValid = rule.validate(input.value);
      if (!rule.isValid) {
        isValidAll = false;
      }
    }

    return isValidAll;
  };

  const clearField = (key: TKey) => {
    const rule = findRule(key);
    if (!rule) {
      return;
    }

    rule.isValid = undefined;
  };

  const clearFields = (keys: TKey[]) => {
    keys.forEach((key) => {
      clearField(key);
    });
  };

  const clearAll = () => {
    schema.value.forEach((rule) => {
      rule.isValid = undefined;
    });
  };
  /* ======================= 메서드 ======================= */

  return {
    invalid,
    message,
    show,
    validateField,
    validateForm,
    clearField,
    clearFields,
    clearAll,
  };
};
