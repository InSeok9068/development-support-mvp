import { useDeveloperStore } from '@/stores/developer.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import type { DevelopersResponse } from '@/api/pocketbase-types';
import pb from '@/api/pocketbase';
import type { RecordFullListOptions } from 'pocketbase';

export const useDeveloper = () => {
  /* ======================= 변수 ======================= */
  const { selectDeveloper } = storeToRefs(useDeveloperStore());
  const developers = ref<DevelopersResponse[]>([]);
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const selectDeveloperFullList = async ({
    filter = 'del = false',
    sort = 'sort',
    option = {} as RecordFullListOptions,
  } = {}) => {
    developers.value = await pb.collection('developers').getFullList({
      filter,
      sort,
      ...option,
    });
  };
  /* ======================= 메서드 ======================= */

  return {
    developers,
    selectDeveloper,

    selectDeveloperFullList,
  };
};
