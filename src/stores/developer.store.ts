import type { DevelopersResponse } from '@/api/pocketbase-types';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDeveloperStore = defineStore(
  'developer',
  () => {
    const defaultDeveloper = ref<DevelopersResponse>();
    const selectDeveloper = ref<DevelopersResponse>();

    return { defaultDeveloper, selectDeveloper };
  },
  { persist: true },
);
