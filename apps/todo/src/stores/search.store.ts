import dayjs from 'dayjs';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSearchStore = defineStore('search', () => {
  const initListFilter = () => ({
    createdFrom: dayjs(new Date()).subtract(3, 'M').format('YYYY-MM-DD'),
    createdTo: dayjs(new Date()).format('YYYY-MM-DD'),
    updatedFrom: '',
    updatedTo: '',
    done: true,
    doneDate: '',
    dueDate: '',
    text: '',
    developer: 'ALL',
  });

  const listFilter = ref(initListFilter());

  const clearListFilter = () => {
    listFilter.value = initListFilter();
  };

  return { listFilter, clearListFilter };
});
