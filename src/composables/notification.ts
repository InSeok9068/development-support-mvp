import pb from '@/api/pocketbase';
import { useGlobal } from '@/composables/global';

export const useNotification = () => {
  /* ======================= 변수 ======================= */
  const { global } = useGlobal();
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const checkUnReadNotifications = async () => {
    global.value.notificationDot =
      (
        await pb.collection('notifications').getFullList({
          filter: 'read = false',
        })
      ).length > 0;
  };
  /* ======================= 메서드 ======================= */

  return {
    checkUnReadNotifications,
  };
};
