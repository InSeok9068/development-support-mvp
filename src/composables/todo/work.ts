import pb from '@/api/pocketbase';
import type { WorksResponse } from '@/api/pocketbase-types';
import { useModal } from '@/composables/modal';
import { useDeveloper } from '@/composables/todo/developer';
import { ref } from 'vue';

export const useWork = () => {
  const { message } = useModal();
  const { defaultDeveloper } = useDeveloper();

  const workArgs = ref({
    userId: pb.authStore.model?.id,
    title: '',
    time: 0,
    done: false,
    developer: defaultDeveloper.value?.id,
  });

  const work = ref<WorksResponse>({} as WorksResponse);

  const works = ref<WorksResponse[]>([]);

  const selectWorkFullList = async ({ filter = 'done = false', sort = '-created', option = {} } = {}) => {
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
    option = {},
  } = {}) => {
    works.value = (
      await pb.collection('works').getList(page, perPage, {
        filter,
        sort,
        ...option,
      })
    ).items;
  };

  const selectWork = async (id: string) => {
    work.value = await pb.collection('works').getOne(id);
  };

  const createWork = async () => {
    await pb.collection('works').create(workArgs.value);
    workArgs.value.title = '';
  };

  const updateWork = async () => {
    await pb.collection('works').update(work.value!.id, work.value);
    message.value = '수정완료';
  };

  const deleteWork = async (work: WorksResponse) => {
    await pb.collection('works').delete(work.id);
  };

  const subscribeWorks = async () => {
    pb.collection('works').subscribe('*', (e) => {
      switch (e.action) {
        case 'create':
          works.value.push(e.record);
          break;
        case 'update':
        case 'delete':
          works.value = works.value.filter((i) => i.id !== e.record.id);
          break;
      }
    });
  };

  const doneWork = async (work: WorksResponse) => {
    pb.collection('works').update(work.id, {
      ...work,
      done: true,
      doneDate: new Date(),
    });
  };

  return {
    work,
    works,
    workArgs,
    selectWorkFullList,
    selectWorkList,
    selectWork,
    createWork,
    updateWork,
    deleteWork,
    subscribeWorks,
    doneWork,
  };
};
