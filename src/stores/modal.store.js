import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useModalStore = defineStore(
  'modal',
  () => {
    const message = ref('');

    return { message };
  },
  { persist: true },
);
