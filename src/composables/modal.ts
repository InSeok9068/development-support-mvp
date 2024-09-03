import { useModalStore } from '@/stores/modal.store';
import type { UiModalArgs } from '@/ui/modal.ui';
import { storeToRefs } from 'pinia';

export const useModal = () => {
  /* ======================= 변수 ======================= */
  const { modal } = storeToRefs(useModalStore());
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const updateModal = (args: UiModalArgs) => {
    Object.assign(modal.value, args);
  };

  const showMessageModal = (message: string) => {
    updateModal({
      ...modal.value,
      show: true,
      message,
    });
  };

  const clearModal = () => {
    modal.value.show = false;
    modal.value.title = '알림';
    modal.value.message = '';
    modal.value.dutationMs = undefined;
    modal.value.fn = undefined;
  };
  /* ======================= 메서드 ======================= */

  return {
    modal,

    showMessageModal,
    clearModal,
  };
};
