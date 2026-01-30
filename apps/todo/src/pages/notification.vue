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
import { useNotification } from '@/composables/notification';
import dayjs from 'dayjs';
import { computed, ref } from 'vue';

/* ======================= 변수 ======================= */
const { fetchUnreadCount, useNotificationsQuery, markRead } = useNotification();
const notificationsQuery = useNotificationsQuery(ref({ page: 1, perPage: 20, sort: '-created' }));
const notifications = computed(() => notificationsQuery.data.value ?? []);
/* ======================= 변수 ======================= */

/* ======================= 메서드 ======================= */
const onClickRead = async (notification: NotificationsResponse) => {
  await markRead(notification.id);
  await fetchUnreadCount();
};
/* ======================= 메서드 ======================= */
</script>
