import { useToastStore } from '@/stores/toast.store';
import type { UiToastArgs } from '@/ui/toast.ui';
import { storeToRefs } from 'pinia';

export const useToast = () => {
  /* ======================= 변수 ======================= */
  const { toast } = storeToRefs(useToastStore());
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const updateToast = (args: UiToastArgs) => {
    Object.assign(toast.value, args);
  };

  const showMessageToast = (message: string) => {
    updateToast({
      ...toast.value,
      show: true,
      message,
    });
  };

  const clearToast = () => {
    toast.value.show = false;
    toast.value.message = '';
    toast.value.dutationMs = 3000;
  };
  /* ======================= 메서드 ======================= */

  return {
    toast,

    showMessageToast,
    clearToast,
  };
};
