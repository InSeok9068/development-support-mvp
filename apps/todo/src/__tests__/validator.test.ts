import { useValidator } from '@/composables/validator';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

type TodoFormField = 'title' | 'done' | 'tags';
type MockField = {
  tagName: string;
  name?: string;
  type?: string;
  value?: unknown;
  checked?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  selectedOptions?: Array<{ value: string }>;
};

describe('useValidator', () => {
  const setupDocument = (formId: string, fields: MockField[]) => {
    const mockForm = {
      querySelectorAll: vi.fn(() => fields),
    };
    const mockDocument = {
      forms: {
        namedItem: vi.fn((id: string) => (id === formId ? mockForm : null)),
      },
    };

    vi.stubGlobal('document', mockDocument);
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('validateField는 개별 필드 유효성 상태를 반영한다', () => {
    const validator = useValidator<TodoFormField>([
      {
        key: 'title',
        message: '제목은 2글자 이상이어야 합니다.',
        validate: (value) => typeof value === 'string' && 2 <= value.trim().length,
      },
    ]);

    expect(validator.validateField('title', 'a')).toBe(false);
    expect(validator.invalid('title')).toBe(true);
    expect(validator.show('title')).toBe(true);
    expect(validator.message('title')).toBe('제목은 2글자 이상이어야 합니다.');

    validator.clearField('title');
    expect(validator.invalid('title')).toBeUndefined();
    expect(validator.show('title')).toBe(false);
  });

  test('validateForm은 form 필드를 순회하며 Shoelace 값도 검증한다', () => {
    const doneCheckbox: MockField = {
      tagName: 'sl-checkbox',
      name: 'done',
      checked: true,
    };
    const tagsSelect: MockField = {
      tagName: 'select',
      name: 'tags',
      multiple: true,
      selectedOptions: [{ value: 'frontend' }, { value: 'backend' }],
    };
    setupDocument('todo-form', [
      { tagName: 'input', name: 'title', value: '테스트 업무' },
      doneCheckbox,
      tagsSelect,
      { tagName: 'input', name: 'title', disabled: true, value: '' },
      { tagName: 'input', name: 'done', type: 'button', value: '' },
    ]);

    const validator = useValidator<TodoFormField>([
      {
        key: 'title',
        validate: (value) => typeof value === 'string' && value.length > 0,
      },
      {
        key: 'done',
        validate: (value) => value === true,
      },
      {
        key: 'tags',
        validate: (value) => Array.isArray(value) && value.includes('frontend') && value.includes('backend'),
      },
    ]);

    const result = validator.validateForm('todo-form');

    expect(result).toBe(true);
    expect(validator.invalid('title')).toBe(false);
    expect(validator.invalid('done')).toBe(false);
    expect(validator.invalid('tags')).toBe(false);
  });

  test('validateForm은 잘못된 값을 감지하고 기본 메시지를 유지한다', () => {
    const doneCheckbox: MockField = {
      tagName: 'sl-checkbox',
      name: 'done',
      checked: false,
    };
    const tagsSelect: MockField = {
      tagName: 'sl-select',
      name: 'tags',
      value: [],
    };
    setupDocument('todo-form', [
      { tagName: 'input', name: 'title', value: '테스트 업무' },
      doneCheckbox,
      tagsSelect,
    ]);

    const validator = useValidator<TodoFormField>([
      {
        key: 'title',
        validate: (value) => typeof value === 'string' && value.length > 0,
      },
      {
        key: 'done',
        validate: (value) => value === true,
      },
      {
        key: 'tags',
        validate: (value) => Array.isArray(value) && value.length > 0,
      },
    ]);

    const result = validator.validateForm('todo-form');

    expect(result).toBe(false);
    expect(validator.show('done')).toBe(true);
    expect(validator.show('tags')).toBe(true);
    expect(validator.message('done')).toBe('입력값이 올바르지 않습니다.');
  });
});
