import pb from '@/api/pocketbase';
import { Collections } from '@/api/pocketbase-types';
import { useGlobal } from '@/composables/global';
import { useToast } from '@/composables/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import { computed, unref, watch, type Ref } from 'vue';

export const useNotification = () => {
  /* ======================= 변수 ======================= */
  const { global } = useGlobal();
  const { showMessageToast } = useToast();
  const queryClient = useQueryClient();
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  watch(
    () => unreadQuery.data.value,
    (count) => {
      if (typeof count === 'number') {
        global.value.notificationDot = count > 0;
      }
    },
    { immediate: true },
  );
  /* ======================= 감시자 ======================= */

  /* ======================= 메서드 ======================= */
  const loadUnreadCount = async () =>
    (
      await pb.collection(Collections.Notifications).getFullList({
        filter: 'read = false',
      })
    ).length;

  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: loadUnreadCount,
  });

  const fetchUnreadCount = async () => {
    const count = await queryClient.fetchQuery({
      queryKey: ['notifications', 'unread-count'],
      queryFn: loadUnreadCount,
    });
    global.value.notificationDot = count > 0;
  };

  const subscribeNotification = async (on: boolean = true) => {
    if (on) {
      await pb.collection(Collections.Notifications).subscribe('*', (e) => {
        switch (e.action) {
          case 'create':
            // 브라우저 알림
            new Notification(e.record.title, {
              body: e.record.message,
            });

            // 토스트 알림
            showMessageToast(`[${e.record.title}] ${e.record.message}`);

            // 알림 Dot 표기
            global.value.notificationDot = true;
        }
      });
    } else {
      await pb.collection(Collections.Notifications).unsubscribe('*');
    }
  };

  const subscribeScheduledNotifications = async (on: boolean = true) => {
    if (on) {
      // 1분 마다 확인
      setInterval(async () => {
        const scheduledNotifications = await pb.collection(Collections.ScheduledNotifications).getFullList({
          filter: `time <= '${dayjs().format('YYYY-MM-DD HH:mm')}'`,
          sort: 'created',
        });

        scheduledNotifications.forEach((record) => {
          pb.collection(Collections.ScheduledNotifications).delete(record.id);
          pb.collection(Collections.Notifications).create(record);
        });
      }, 1000 * 60);
    }
  };

  /* ======================= 쿼리 ======================= */
  const useNotificationsQuery = (
    params: Ref<{ page: number; perPage: number; sort: string }> | { page: number; perPage: number; sort: string },
  ) => {
    const p = computed(() => unref(params));
    return useQuery({
      queryKey: computed(() => ['notifications', p.value]),
      queryFn: async () =>
        (
          await pb.collection(Collections.Notifications).getList(p.value.page, p.value.perPage, {
            sort: p.value.sort,
          })
        ).items,
    });
  };
  /* ======================= 쿼리 ======================= */

  /* ======================= 뮤테이션 ======================= */
  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      pb.collection(Collections.Notifications).update(id, {
        read: true,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      });
    },
  });

  const markRead = (id: string) => markReadMutation.mutateAsync(id);
  /* ======================= 뮤테이션 ======================= */
  /* ======================= 메서드 ======================= */

  return {
    fetchUnreadCount,
    subscribeNotification,
    subscribeScheduledNotifications,
    useNotificationsQuery,
    markRead,
  };
};
