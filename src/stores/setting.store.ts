import { usePermission } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingStore = defineStore(
  'setting',
  () => {
    const setting = ref({
      theme: 'white',
      notificationPermission: usePermission('notifications'),
      daysBefore: 1,
    });

    return { setting };
  },
  { persist: true },
);
