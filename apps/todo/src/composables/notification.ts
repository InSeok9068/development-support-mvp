import pb from '@/api/pocketbase';
import { Collections, type Create, type NotificationsResponse } from '@/api/pocketbase-types';
import { useGlobal } from '@/composables/global';
import { useRealtime } from '@/composables/realtime';
import { useToast } from '@/composables/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { tryOnScopeDispose, useIntervalFn } from '@vueuse/core';
import dayjs from 'dayjs';
import { computed, isRef, ref, unref, watch, type Ref } from 'vue';

type NotificationListQueryParams = {
  page: number;
  perPage: number;
  sort: string;
};

export const useNotification = () => {
  /* ======================= 변수 ======================= */
  const { global } = useGlobal();
  const { showMessageToast } = useToast();
  const { subscribeRealtime, unsubscribeRealtime } = useRealtime<NotificationsResponse>(Collections.Notifications);
  const queryClient = useQueryClient();
  const notificationsUnreadCountQueryKey = ['notifications', 'unread-count'] as const;
  const scheduledNotificationsDueQueryKey = ['scheduled-notifications', 'due'] as const;
  const notificationsListQueryParams = ref<NotificationListQueryParams>({
    page: 1,
    perPage: 20,
    sort: '-created',
  });
  const isNotificationsListEnabled = ref(false);
  const buildNotificationsListQueryKey = (params: NotificationListQueryParams) =>
    [
      'notifications',
      'list',
      {
        page: params.page,
        perPage: params.perPage,
        sort: params.sort,
      },
    ] as const;
  type NotificationsListQueryKey = ReturnType<typeof buildNotificationsListQueryKey>;
  const notificationsListQueryKey = computed(() => buildNotificationsListQueryKey(notificationsListQueryParams.value));
  const scheduledNotificationsInterval = useIntervalFn(
    () => {
      if (isCheckingScheduledNotifications) {
        return;
      }
      isCheckingScheduledNotifications = true;
      void fetchDueScheduledNotifications()
        .then(async (scheduledNotifications) => {
          for (const record of scheduledNotifications) {
            await removeScheduledNotification(record.id);
            await createNotification(record as Create<Collections.Notifications>);
          }
        })
        .finally(() => {
          isCheckingScheduledNotifications = false;
        });
    },
    1000 * 60,
    { immediate: false },
  );
  let isCheckingScheduledNotifications = false;

  const loadUnreadCount = async () =>
    (
      await pb.collection(Collections.Notifications).getFullList({
        filter: 'read = false',
      })
    ).length;

  const loadNotificationList = async (params: NotificationListQueryParams) =>
    (
      await pb.collection(Collections.Notifications).getList(params.page, params.perPage, {
        sort: params.sort,
      })
    ).items;

  const unreadQuery = useQuery({
    queryKey: notificationsUnreadCountQueryKey,
    queryFn: loadUnreadCount,
  });

  const notificationsListQuery = useQuery({
    queryKey: notificationsListQueryKey,
    queryFn: ({ queryKey }) => {
      const [, , params] = queryKey as NotificationsListQueryKey;
      return loadNotificationList(params);
    },
    enabled: computed(() => isNotificationsListEnabled.value),
  });
  const notifications = computed(() => notificationsListQuery.data.value ?? []);
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
    scheduledNotificationsInterval.pause();
  });
  /* ======================= 생명주기 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchUnreadCount = async () => {
    const count = await queryClient.fetchQuery({
      queryKey: notificationsUnreadCountQueryKey,
      queryFn: loadUnreadCount,
    });
    global.value.notificationDot = count > 0;
  };

  const subscribeNotificationsRealtime = async () => {
    await subscribeRealtime((e) => {
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
  };

  const unsubscribeNotificationsRealtime = async () => {
    await unsubscribeRealtime('*');
  };

  const fetchDueScheduledNotifications = async () => {
    return await queryClient.fetchQuery({
      queryKey: scheduledNotificationsDueQueryKey,
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

  const subscribeScheduledNotifications = async () => {
    if (scheduledNotificationsInterval.isActive.value) {
      return;
    }

    // 1분 마다 확인
    scheduledNotificationsInterval.resume();
  };

  const unsubscribeScheduledNotifications = () => {
    scheduledNotificationsInterval.pause();
  };

  const subscribeNotificationsByPermission = (
    permission: Ref<PermissionState | undefined> | PermissionState | undefined,
  ) => {
    watch(
      () => (isRef(permission) ? permission.value : permission),
      (value) => {
        const isGranted = value === 'granted';
        if (isGranted) {
          void subscribeNotificationsRealtime();
          void subscribeScheduledNotifications();
          return;
        }
        void unsubscribeNotificationsRealtime();
        unsubscribeScheduledNotifications();
      },
      { immediate: true },
    );
  };

  const fetchNotificationList = async (
    params?: Ref<NotificationListQueryParams> | NotificationListQueryParams | undefined,
  ) => {
    const nextParams = params ? unref(params) : notificationsListQueryParams.value;
    notificationsListQueryParams.value = { ...nextParams };
    const nextQueryKey = buildNotificationsListQueryKey(nextParams);
    isNotificationsListEnabled.value = true;
    await queryClient.fetchQuery({
      queryKey: nextQueryKey,
      queryFn: ({ queryKey }) => {
        const [, , queryParams] = queryKey as NotificationsListQueryKey;
        return loadNotificationList(queryParams);
      },
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
        queryKey: notificationsUnreadCountQueryKey,
      });
    },
  });

  const markRead = (id: string) => markReadMutation.mutateAsync(id);
  /* ======================= 메서드 ======================= */

  return {
    notifications,

    fetchUnreadCount,
    fetchNotificationList,
    subscribeNotificationsRealtime,
    unsubscribeNotificationsRealtime,
    subscribeScheduledNotifications,
    unsubscribeScheduledNotifications,
    subscribeNotificationsByPermission,
    markRead,
  };
};
