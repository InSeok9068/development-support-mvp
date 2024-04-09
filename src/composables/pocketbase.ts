import pb from '@/api/pocketbase';
import { useModal } from '@/composables/modal';

export const usePocketbase = () => {
  const { message } = useModal();

  const initPocketbase = () => {
    pb.afterSend = (response, data) => {
      if (200 !== response.status && 204 != response.status) {
        console.error(data);
        message.value = data.message;

        return data;
      } else {
        return data;
      }
    };
  };

  return { initPocketbase };
};
