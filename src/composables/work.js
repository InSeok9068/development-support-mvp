import pb from '@/api/pocketbase';
import { useModal } from '@/composables/modal';
import { ref } from 'vue';

export const useWork = () => {
  const { message } = useModal();

  const workArgs = ref({
    userId: pb.authStore.model.id,
    title: '',
    time: 0,
    done: false,
    developer: 'd4he5x5uqtz0gm4',
  });

  const work = ref({});

  const works = ref([]);

  const selectWorkList = async (developer) => {
    let developerFilter = '';

    if (developer) {
      developerFilter = `&& developer = '${developer.id}'`;
    }

    works.value = await pb.collection('works').getFullList({
      filter: `done = false ${developerFilter}`,
      sort: '-created',
    });
  };

  const selectWork = async (id) => {
    work.value = await pb.collection('works').getOne(id);
  };

  const createWork = async () => {
    try {
      await pb.collection('works').create(workArgs.value);
      workArgs.value.title = '';
    } catch (err) {
      message.value = err.message;
    }
  };

  const updateWork = async () => {
    try {
      await pb.collection('works').update(work.value.id, work.value);
      message.value = '수정완료';
    } catch (err) {
      message.value = err.message;
    }
  };

  const deleteWork = async (work) => {
    try {
      await pb.collection('works').delete(work.id);
    } catch (err) {
      message.value = err.message;
    }
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

  const doneWork = async (work) => {
    pb.collection('works').update(work.id, {
      ...work,
      done: true,
    });
  };

  return {
    work,
    works,
    workArgs,
    selectWorkList,
    selectWork,
    createWork,
    updateWork,
    deleteWork,
    subscribeWorks,
    doneWork,
  };
};
