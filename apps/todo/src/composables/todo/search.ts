import { useSearchStore } from '@/stores/search.store';
import { storeToRefs } from 'pinia';

export const useSearch = () => {
  /* ======================= 변수 ======================= */
  const { listFilter } = storeToRefs(useSearchStore());
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 메서드 ======================= */
  const { clearListFilter } = useSearchStore();
  /* ======================= 메서드 ======================= */

  return {
    listFilter,

    clearListFilter,
  };
};
