import pb from '@/api/pocketbase';
import { useModal } from '@packages/ui';

type PocketBaseErrorPayload = {
  message?: string;
};

export const usePocketbase = () => {
  /* ======================= 변수 ======================= */
  const { showMessageModal } = useModal();
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const initPocketbase = () => {
    pb.afterSend = (response, data) => {
      if (response.status < 200 || response.status >= 300) {
        const errorMessage = (data as PocketBaseErrorPayload | null)?.message ?? '요청 처리 중 오류가 발생했습니다.';
        showMessageModal(errorMessage);
      }

      return data;
    };
  };
  /* ======================= 메서드 ======================= */

  return {
    initPocketbase,
  };
};
