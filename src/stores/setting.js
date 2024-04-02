import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingStore = defineStore(
  'setting',
  () => {
    const setting = ref({
      theme: 'white',
    });

    return { setting };
  },
  { persist: true },
);
