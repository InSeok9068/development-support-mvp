import { usePermission } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useGlobalStore = defineStore(
  'global',
  () => {
    const global = ref({
      theme: 'white',
      notificationPermission: usePermission('notifications'),
      notificationDot: false,
    });

    return { global };
  },
  { persist: true },
);
