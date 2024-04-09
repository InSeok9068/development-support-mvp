import pb from '@/api/pocketbase';
import type { DevelopersResponse } from '@/api/pocketbase-types';
import { useDeveloperStore } from '@/stores/developer.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

export const useDeveloper = () => {
  const { defaultDeveloper, selectDeveloper } = storeToRefs(useDeveloperStore());

  const developers = ref<DevelopersResponse[]>([]);

  const selectDeveloperFullList = async () => {
    developers.value = await pb.collection('developers').getFullList({
      sort: 'sort',
    });
  };

  const setDefaultDeveloper = async () => {
    defaultDeveloper.value = (
      await pb.collection('developers').getList(1, 1, {
        filter: `isDeveloper = false`,
      })
    ).items[0];
  };

  return {
    developers,
    selectDeveloper,
    defaultDeveloper,
    selectDeveloperFullList,
    setDefaultDeveloper,
  };
};
