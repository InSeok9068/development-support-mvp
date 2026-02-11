<template>
  <main class="container mx-auto px-3 py-4 lg:px-4">
    <sl-card class="w-full shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h4 class="font-semibold">알림함</h4>
          <div class="text-xs text-slate-500">최근 알림 내역</div>
        </div>
        <sl-tag size="small" variant="neutral">{{ notifications.length }}건</sl-tag>
      </div>

      <div class="mb-3 flex flex-wrap items-center gap-2">
        <sl-tag size="small" variant="primary">전체</sl-tag>
        <sl-tag size="small" variant="neutral">미읽음</sl-tag>
        <sl-tag size="small" variant="neutral">읽음</sl-tag>
      </div>

      <sl-divider></sl-divider>
      <div class="overflow-x-auto">
        <table class="w-full table-fixed">
          <colgroup>
            <col />
            <col class="w-48" />
            <col class="w-24" />
            <col class="w-24" />
          </colgroup>
          <thead>
            <tr>
              <th>제목</th>
              <th>전송일시</th>
              <th class="text-center">상태</th>
              <th class="text-center">액션</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(notification, index) in notifications" :key="notification.id">
              <tr>
                <td class="max-w-80 overflow-hidden text-ellipsis whitespace-nowrap">
                  {{ notification.title }}
                </td>
                <td>{{ dayjs(notification.created).format('YYYY-MM-DD HH:mm:ss') }}</td>
                <td class="text-center">
                  <sl-badge v-if="notification.read" size="small" variant="success">읽음</sl-badge>
                  <sl-badge v-else size="small" variant="warning">미읽음</sl-badge>
                </td>
                <td class="text-center">
                  <sl-button v-show="!notification.read" size="small" variant="text" @click="onClickRead(notification)">
                    읽기
                  </sl-button>
                  <span v-show="notification.read">-</span>
                </td>
              </tr>
              <tr v-if="index < notifications.length - 1">
                <td colspan="4">
                  <sl-divider class="my-1"></sl-divider>
                </td>
              </tr>
            </template>
            <tr v-if="notifications.length === 0">
              <td colspan="4" class="py-6 text-center text-sm text-slate-400">알림이 없습니다</td>
            </tr>
          </tbody>
        </table>
      </div>
    </sl-card>
  </main>
</template>

<script setup lang="ts">
import type { NotificationsResponse } from '@/api/pocketbase-types';
import { useNotification } from '@/composables/notification';
import dayjs from 'dayjs';
import { computed, ref } from 'vue';

/* ======================= 변수 ======================= */
const { useNotificationsQuery, markRead } = useNotification();
const notificationsQuery = useNotificationsQuery(ref({ page: 1, perPage: 20, sort: '-created' }));
const notifications = computed(() => notificationsQuery.data.value ?? []);
/* ======================= 변수 ======================= */

/* ======================= 메서드 ======================= */
const onClickRead = async (notification: NotificationsResponse) => {
  await markRead(notification.id);
};
/* ======================= 메서드 ======================= */
</script>
