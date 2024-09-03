import { useSearchStore } from '@/stores/search.store';
import { storeToRefs } from 'pinia';

export const useSearch = () => {
  /* ======================= 변수 ======================= */
  const { listFilter } = storeToRefs(useSearchStore());
  const { clearListFilter } = useSearchStore();
  /* ======================= 변수 ======================= */

  return {
    listFilter,

    clearListFilter,
  };
};
