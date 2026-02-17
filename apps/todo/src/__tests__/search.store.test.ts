import { useSearchStore } from '@/stores/search.store';
import dayjs from 'dayjs';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const fixedNow = new Date('2026-02-17T12:00:00.000Z');

describe('useSearchStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('초기 listFilter는 최근 3개월 기간과 기본 조건을 가진다', () => {
    const searchStore = useSearchStore();

    expect(searchStore.listFilter).toEqual({
      createdFrom: dayjs(fixedNow).subtract(3, 'M').format('YYYY-MM-DD'),
      createdTo: dayjs(fixedNow).format('YYYY-MM-DD'),
      updatedFrom: '',
      updatedTo: '',
      done: true,
      doneDate: '',
      dueDate: '',
      text: '',
      developer: 'ALL',
    });
  });

  test('clearListFilter는 변경된 필터를 초기값으로 되돌린다', () => {
    const searchStore = useSearchStore();
    searchStore.listFilter.done = false;
    searchStore.listFilter.text = '긴급';
    searchStore.listFilter.developer = 'dev-1';
    searchStore.listFilter.updatedFrom = '2026-01-01';
    searchStore.listFilter.updatedTo = '2026-01-31';

    searchStore.clearListFilter();

    expect(searchStore.listFilter).toEqual({
      createdFrom: dayjs(fixedNow).subtract(3, 'M').format('YYYY-MM-DD'),
      createdTo: dayjs(fixedNow).format('YYYY-MM-DD'),
      updatedFrom: '',
      updatedTo: '',
      done: true,
      doneDate: '',
      dueDate: '',
      text: '',
      developer: 'ALL',
    });
  });
});
