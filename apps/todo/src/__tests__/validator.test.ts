import { useValidator } from '@/composables/validator';
import { beforeEach, describe, expect, test } from 'vitest';

type TodoFormField = 'title' | 'done' | 'tags';
type ShoelaceCheckboxElement = HTMLElement & { name: string; checked: boolean };
type ShoelaceSelectElement = HTMLElement & { name: string; value: unknown };

const createTodoForm = () => {
  const form = document.createElement('form');
  form.id = 'todo-form';
  form.name = 'todo-form';

  const titleInput = document.createElement('input');
  titleInput.name = 'title';
  titleInput.value = '테스트 업무';

  const doneCheckbox = document.createElement('sl-checkbox') as ShoelaceCheckboxElement;
  doneCheckbox.name = 'done';
  doneCheckbox.checked = true;

  const tagsSelect = document.createElement('sl-select') as ShoelaceSelectElement;
  tagsSelect.name = 'tags';
  tagsSelect.value = ['frontend', 'backend'];

  const disabledInput = document.createElement('input');
  disabledInput.name = 'title';
  disabledInput.value = '';
  disabledInput.disabled = true;

  const buttonInput = document.createElement('input');
  buttonInput.name = 'done';
  buttonInput.type = 'button';
  buttonInput.value = '';

  form.append(titleInput, doneCheckbox, tagsSelect, disabledInput, buttonInput);
  document.body.append(form);

  return { doneCheckbox, tagsSelect };
};

describe('useValidator', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
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
    const { doneCheckbox, tagsSelect } = createTodoForm();

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

    doneCheckbox.checked = true;
    tagsSelect.value = ['frontend', 'backend'];

    const result = validator.validateForm('todo-form');

    expect(result).toBe(true);
    expect(validator.invalid('title')).toBe(false);
    expect(validator.invalid('done')).toBe(false);
    expect(validator.invalid('tags')).toBe(false);
  });

  test('validateForm은 잘못된 값을 감지하고 기본 메시지를 유지한다', () => {
    const { doneCheckbox, tagsSelect } = createTodoForm();

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

    doneCheckbox.checked = false;
    tagsSelect.value = [];

    const result = validator.validateForm('todo-form');

    expect(result).toBe(false);
    expect(validator.show('done')).toBe(true);
    expect(validator.show('tags')).toBe(true);
    expect(validator.message('done')).toBe('입력값이 올바르지 않습니다.');
  });
});
