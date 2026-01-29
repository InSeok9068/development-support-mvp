import type { UiToastArgs } from '@/ui/toast.ui';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast', () => {
  const toast = ref<UiToastArgs>({
    show: false,
    message: '',
    dutationMs: 3000,
  });

  return { toast };
});
