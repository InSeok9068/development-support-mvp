import pb from '@/api/pocketbase';
import { Collections, type Create } from '@/api/pocketbase-types';
import { useGlobal } from '@/composables/global';
import { useToast } from '@/composables/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { tryOnScopeDispose } from '@vueuse/core';
import dayjs from 'dayjs';
import { computed, isRef, unref, watch, type Ref } from 'vue';

export const useNotification = () => {
  /* ======================= 변수 ======================= */
  const { global } = useGlobal();
  const { showMessageToast } = useToast();
  const queryClient = useQueryClient();
  const scheduledIntervalIds: number[] = [];
  let isNotificationSubscribed = false;

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

  /* ======================= 생명주기 ======================= */
  tryOnScopeDispose(() => {
    if (isNotificationSubscribed) {
      void pb.collection(Collections.Notifications).unsubscribe('*');
      isNotificationSubscribed = false;
    }

    if (scheduledIntervalIds.length > 0) {
      scheduledIntervalIds.forEach((id) => window.clearInterval(id));
      scheduledIntervalIds.length = 0;
    }
  });
  /* ======================= 생명주기 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchUnreadCount = async () => {
    const count = await queryClient.fetchQuery({
      queryKey: ['notifications', 'unread-count'],
      queryFn: loadUnreadCount,
    });
    global.value.notificationDot = count > 0;
  };

  const subscribeNotificationMutation = useMutation({
    mutationFn: async (on: boolean) => {
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
        isNotificationSubscribed = true;
      } else {
        await pb.collection(Collections.Notifications).unsubscribe('*');
        isNotificationSubscribed = false;
      }
    },
  });

  const subscribeNotification = (on: boolean = true) => subscribeNotificationMutation.mutateAsync(on);

  const fetchDueScheduledNotifications = async () => {
    return await queryClient.fetchQuery({
      queryKey: ['scheduled-notifications', 'due'],
      queryFn: async () =>
        await pb.collection(Collections.ScheduledNotifications).getFullList({
          filter: `time <= '${dayjs().format('YYYY-MM-DD HH:mm')}'`,
          sort: 'created',
        }),
    });
  };

  const deleteScheduledNotificationMutation = useMutation({
    mutationFn: (id: string) => pb.collection(Collections.ScheduledNotifications).delete(id),
  });

  const createNotificationMutation = useMutation({
    mutationFn: (payload: Create<Collections.Notifications>) =>
      pb.collection(Collections.Notifications).create(payload),
  });

  const removeScheduledNotification = (id: string) => deleteScheduledNotificationMutation.mutateAsync(id);
  const createNotification = (payload: Create<Collections.Notifications>) =>
    createNotificationMutation.mutateAsync(payload);

  const subscribeScheduledNotifications = async (on: boolean = true) => {
    if (!on) {
      if (scheduledIntervalIds.length > 0) {
        scheduledIntervalIds.forEach((id) => window.clearInterval(id));
        scheduledIntervalIds.length = 0;
      }
      return;
    }

    // 1분 마다 확인
    const intervalId = window.setInterval(async () => {
      const scheduledNotifications = await fetchDueScheduledNotifications();
      for (const record of scheduledNotifications) {
        await removeScheduledNotification(record.id);
        await createNotification(record as Create<Collections.Notifications>);
      }
    }, 1000 * 60);
    scheduledIntervalIds.push(intervalId);
  };

  const subscribeNotificationsByPermission = (permission: Ref<PermissionState | undefined> | PermissionState | undefined) => {
    watch(
      () => (isRef(permission) ? permission.value : permission),
      (value) => {
        const isGranted = value === 'granted';
        void subscribeNotification(isGranted);
        void subscribeScheduledNotifications(isGranted);
      },
      { immediate: true },
    );
  };

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
  /* ======================= 메서드 ======================= */

  return {
    fetchUnreadCount,
    subscribeNotification,
    subscribeScheduledNotifications,
    subscribeNotificationsByPermission,
    useNotificationsQuery,
    markRead,
  };
};
