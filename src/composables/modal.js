import { useModalStore } from '@/stores/modal';
import { storeToRefs } from 'pinia';

export const useModal = () => {
  const { message } = storeToRefs(useModalStore());

  return {
    message,
  };
};
