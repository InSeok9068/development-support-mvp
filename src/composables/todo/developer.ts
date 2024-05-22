import pb from '@/api/pocketbase';
import type { DevelopersResponse } from '@/api/pocketbase-types';
import { useModal } from '@/composables/modal';
import { useDeveloperStore } from '@/stores/developer.store';
import type { UiDeveloperArgs } from '@/ui/todo.ui';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

export const useDeveloper = () => {
  const { message } = useModal();
  const { selectDeveloper } = storeToRefs(useDeveloperStore());

  const developerArgs = ref<UiDeveloperArgs>({
    id: '',
    user: pb.authStore.model?.id,
    name: '',
    sort: 1,
    isLeader: false,
    del: false,
  });

  const developers = ref<DevelopersResponse[]>([]);

  const developer = ref<DevelopersResponse>({} as DevelopersResponse);

  const selectDeveloperFullList = async () => {
    developers.value = await pb.collection('developers').getFullList({
      filter: `del = false`,
      sort: 'sort',
    });
  };

  const createDeveloper = async () => {
    await pb.collection('developers').create(developerArgs.value);
    message.value = '등록 완료';
  };

  const updateDeveloper = async () => {
    await pb.collection('developers').update(developerArgs.value.id, developerArgs.value);
    message.value = '수정 완료';
  };

  return {
    developer,
    developers,
    developerArgs,
    selectDeveloper,
    selectDeveloperFullList,
    createDeveloper,
    updateDeveloper,
  };
};
