import pb from '@/api/pocketbase';
import { useModal } from '@packages/ui';

export const usePocketbase = () => {
  /* ======================= 변수 ======================= */
  const { showMessageModal } = useModal();
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 메서드 ======================= */
  const initPocketbase = () => {
    pb.afterSend = (response, data) => {
      if (200 !== response.status && 204 != response.status) {
        console.error(data);
        showMessageModal(data.message);

        return data;
      } else {
        return data;
      }
    };
  };
  /* ======================= 메서드 ======================= */

  return {
    initPocketbase,
  };
};
