import pb from '@/api/pocketbase';
import { ref } from 'vue';

export const useDeveloper = () => {
  const developers = ref([]);

  const selectDeveloperList = async () => {
    developers.value = await pb.collection('developers').getFullList({
      sort: 'sort',
    });
  };

  return {
    developers,
    selectDeveloperList,
  };
};
