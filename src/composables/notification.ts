import pb from '@/api/pocketbase';
import { useGlobal } from '@/composables/global';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { watch } from 'vue';

export const useNotification = () => {
  /* ======================= 변수 ======================= */
  const { global } = useGlobal();
  const queryClient = useQueryClient();
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const loadUnreadCount = async () =>
    (
      await pb.collection('notifications').getFullList({
        filter: 'read = false',
      })
    ).length;

  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: loadUnreadCount,
  });

  watch(
    () => unreadQuery.data.value,
    (count) => {
      if (typeof count === 'number') {
        global.value.notificationDot = count > 0;
      }
    },
    { immediate: true },
  );

  const fetchUnreadCount = async () => {
    const count = await queryClient.fetchQuery({
      queryKey: ['notifications', 'unread-count'],
      queryFn: loadUnreadCount,
    });
    global.value.notificationDot = count > 0;
  };
  /* ======================= 메서드 ======================= */

  return {
    fetchUnreadCount,
  };
};
