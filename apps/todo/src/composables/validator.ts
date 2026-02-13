import { ref } from 'vue';

type ValidatorValue = string | number | boolean | string[] | null | undefined;

type FormFieldElement = HTMLElement & {
  name?: string;
  type?: string;
  value?: unknown;
  checked?: boolean;
  disabled?: boolean;
  multiple?: boolean;
};

interface ValidatorRule<TKey extends string> {
  key: TKey;
  isValid?: boolean;
  validate: (value: ValidatorValue) => boolean;
  message?: string;
}

export const useValidator = <TKey extends string>(initialSchema: ValidatorRule<TKey>[] = []) => {
  const defaultMessage = '입력값이 올바르지 않습니다.';
  const fieldSelector =
    'input, select, textarea, sl-input, sl-textarea, sl-select, sl-checkbox, sl-switch, sl-radio-group';

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

    const fields = form.querySelectorAll<FormFieldElement>(fieldSelector);

    let isValidAll = true;
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]!;
      if (!field.name || isSkippableField(field)) {
        continue;
      }

      const key = field.name as TKey;
      const rule = findRule(key);
      if (!rule) {
        continue;
      }

      rule.isValid = rule.validate(readFieldValue(field));
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

  const isSkippableField = (field: FormFieldElement) => {
    if (field.disabled) {
      return true;
    }

    const type = String(field.type ?? '').toLowerCase();
    return ['submit', 'button', 'reset'].includes(type);
  };

  const readFieldValue = (field: FormFieldElement): ValidatorValue => {
    const tagName = field.tagName.toLowerCase();
    if (tagName === 'input') {
      const input = field as HTMLInputElement;
      if (['checkbox', 'radio'].includes(input.type)) {
        return input.checked;
      }
      return input.value ?? '';
    }

    if (tagName === 'select') {
      const select = field as HTMLSelectElement;
      if (select.multiple) {
        return Array.from(select.selectedOptions).map((option) => option.value);
      }
      return select.value ?? '';
    }

    if (tagName === 'sl-checkbox' || tagName === 'sl-switch') {
      return Boolean(field.checked);
    }

    const value = field.value;
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }

    if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
      return value;
    }

    return '';
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
