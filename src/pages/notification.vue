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
import { onMounted, ref } from 'vue';
import { useNotification } from '@/composables/notification';

/* ======================= 변수 ======================= */
const notifications = ref<NotificationsResponse[]>([]);
const { checkUnReadNotifications } = useNotification();
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(async () => {
  notifications.value = (
    await pb.collection('notifications').getList(1, 20, {
      sort: '-created',
    })
  ).items;
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickRead = async (notification: NotificationsResponse) => {
  notification.read = true;
  await pb.collection('notifications').update(notification.id, notification);
  await checkUnReadNotifications();
};
/* ======================= 메서드 ======================= */
</script>
