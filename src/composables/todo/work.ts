import pb from '@/api/pocketbase';
import type { WorksRecord, WorksResponse } from '@/api/pocketbase-types';
import { useModal } from '@/composables/modal';
import { ref } from 'vue';

export const useWork = () => {
  const { message } = useModal();

  const workArgs = ref<WorksRecord>({
    user: pb.authStore.model?.id,
    title: '',
    time: 0,
    state: 'wait',
    done: false,
    developer: '',
  });

  const work = ref<WorksResponse>({} as WorksResponse);

  const works = ref<WorksResponse[]>([]);

  const selectWorkFullList = async ({ filter = 'done = false', sort = 'sort,-created', option = {} } = {}) => {
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
    const formDate = new FormData();
    for (const [key, value] of Object.entries(work.value)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formDate.append(key, value as any);
    }

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    for (const file of fileInput.files!) {
      formDate.append('file', file);
    }

    await pb.collection('works').update(work.value.id, formDate);
    message.value = '수정완료';

    // 파일 랜더링을 위해 재조회 및 기존 파일 클리어
    await selectWork(work.value.id);
    fileInput.value = '';
  };

  const updateWorkBySort = async (work: WorksResponse) => {
    await pb.collection('works').update(work.id, work);
  };

  const deleteWork = async (work: WorksResponse) => {
    await pb.collection('works').delete(work.id);
  };

  const deleteWorkImage = async (work: WorksResponse) => {
    await pb.collection('works').update(work.id, {
      file: null,
    });
    work.file = '';
  };

  const doneWork = async (work: WorksResponse) => {
    pb.collection('works').update(work.id, {
      ...work,
      done: true,
      state: 'done',
      doneDate: new Date(),
    });
  };

  const subscribeWorks = async () => {
    pb.collection('works').subscribe('*', (e) => {
      switch (e.action) {
        case 'create':
          works.value.push(e.record);
          break;
        case 'update':
          if (e.record.done) {
            works.value = works.value.filter((i) => i.id !== e.record.id);
          }
          break;
        case 'delete':
          works.value = works.value.filter((i) => i.id !== e.record.id);
          break;
      }
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
    updateWorkBySort,
    deleteWork,
    deleteWorkImage,
    doneWork,
    subscribeWorks,
  };
};
