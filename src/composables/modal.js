import { useModalStore } from '@/stores/modal.store';
import { storeToRefs } from 'pinia';

export const useModal = () => {
  const { message } = storeToRefs(useModalStore());

  return {
    message,
  };
};
