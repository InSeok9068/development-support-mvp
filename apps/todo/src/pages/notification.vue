<template>
  <main class="container">
    <article>
      <table>
        <thead>
          <th>제목</th>
          <th>전송일시</th>
          <th></th>
        </thead>
        <tbody v-for="(notification, index) in notifications" :key="index">
          <td class="max-w-80 overflow-hidden text-ellipsis whitespace-nowrap">
            {{ notification.title }}
          </td>
          <td>{{ dayjs(notification.created).format('YYYY-MM-DD HH:mm:ss') }}</td>
          <td>
            <button v-show="!notification.read" class="w-max text-xs" @click="onClickRead(notification)">읽기</button>
          </td>
        </tbody>
      </table>
    </article>
  </main>
</template>

<script setup lang="ts">
import type { NotificationsResponse } from '@/api/pocketbase-types';
import dayjs from 'dayjs';
import pb from '@/api/pocketbase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useNotification } from '@/composables/notification';

/* ======================= 변수 ======================= */
const queryClient = useQueryClient();
const notificationsQuery = useQuery({
  queryKey: ['notifications', { page: 1, perPage: 20, sort: '-created' }],
  queryFn: async () =>
    (
      await pb.collection('notifications').getList(1, 20, {
        sort: '-created',
      })
    ).items,
});
const notifications = computed(() => notificationsQuery.data.value ?? []);
const { fetchUnreadCount } = useNotification();
const markReadMutation = useMutation({
  mutationFn: (notification: NotificationsResponse) =>
    pb.collection('notifications').update(notification.id, {
      ...notification,
      read: true,
    }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    await queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
  },
});
/* ======================= 변수 ======================= */

/* ======================= 메서드 ======================= */
const onClickRead = async (notification: NotificationsResponse) => {
  await markReadMutation.mutateAsync(notification);
  await fetchUnreadCount();
};
/* ======================= 메서드 ======================= */
</script>
