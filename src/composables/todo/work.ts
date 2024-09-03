import pb from '@/api/pocketbase';
import type { WorksResponse } from '@/api/pocketbase-types';
import { ref } from 'vue';
import type { RecordFullListOptions, RecordListOptions } from 'pocketbase';

export const useWork = () => {
  /* ======================= 변수 ======================= */
  const works = ref<WorksResponse[]>([]);
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const selectWorkFullList = async ({
    filter = 'done = false',
    sort = 'sort,-created',
    option = {} as RecordFullListOptions,
  } = {}) => {
    works.value = await pb.collection('works').getFullList({
      filter,
      sort,
      ...option,
    });
  };

  const selectWorkList = async ({
    filter = 'done = true',
    sort = '-created',
    page = 1,
    perPage = 20,
    option = {} as RecordListOptions,
  } = {}) => {
    works.value = (
      await pb.collection('works').getList(page, perPage, {
        filter,
        sort,
        ...option,
      })
    ).items;
  };

  const deleteWork = async (work: WorksResponse) => {
    await pb.collection('works').delete(work.id);
  };
  /* ======================= 메서드 ======================= */

  return {
    works,

    selectWorkFullList,
    selectWorkList,
    deleteWork,
  };
};
