import type { DevelopersResponse } from '@/api/pocketbase-types';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDeveloperStore = defineStore(
  'developer',
  () => {
    const selectDeveloper = ref<DevelopersResponse | string>();

    return { selectDeveloper };
  },
  { persist: true },
);
