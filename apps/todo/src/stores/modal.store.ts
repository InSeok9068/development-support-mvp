import type { UiModalArgs } from '@/ui/modal.ui';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useModalStore = defineStore('modal', () => {
  const modal = ref<UiModalArgs>({
    show: false,
    title: '알림',
    message: '',
  });

  return { modal };
});
