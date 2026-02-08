import { useModalStore } from '../stores/modal.store';
import type { UiModalArgs } from '../ui/modal.ui';
import { storeToRefs } from 'pinia';

interface ConfirmModalArgs {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

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
      showCancel: false,
      confirmText: '확인',
      cancelText: '취소',
      fn: undefined,
      cancelFn: undefined,
    });
  };

  const showConfirmModal = (args: ConfirmModalArgs) => {
    updateModal({
      ...modal.value,
      show: true,
      title: args.title ?? '확인',
      message: args.message,
      confirmText: args.confirmText ?? '확인',
      cancelText: args.cancelText ?? '취소',
      showCancel: true,
      fn: args.onConfirm,
      cancelFn: args.onCancel,
    });
  };

  const clearModal = () => {
    modal.value.show = false;
    modal.value.title = '알림';
    modal.value.message = '';
    modal.value.dutationMs = undefined;
    modal.value.fn = undefined;
    modal.value.cancelFn = undefined;
    modal.value.confirmText = '확인';
    modal.value.cancelText = '취소';
    modal.value.showCancel = false;
  };
  /* ======================= 메서드 ======================= */

  return {
    modal,

    showMessageModal,
    showConfirmModal,
    clearModal,
  };
};
