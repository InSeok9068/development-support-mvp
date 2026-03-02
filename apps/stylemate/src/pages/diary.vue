<template>
  <main class="page-enter mx-auto flex min-h-screen w-full max-w-md flex-col gap-3 px-4 pb-24 pt-4">
    <header class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">코디일지</h1>
      <sl-button size="small" @click="onClickRefreshWearLogButton">새로고침</sl-button>
    </header>

    <sl-card>
      <div class="flex items-center justify-between gap-2">
        <div class="text-sm">코디 확정 기록</div>
        <sl-tag size="small" variant="primary">{{ wearLogList.length }}건</sl-tag>
      </div>
    </sl-card>

    <sl-card v-if="isWearLogListLoading">
      <div class="text-sm">코디일지를 불러오는 중입니다.</div>
    </sl-card>

    <sl-card v-else-if="!wearLogDateGroups.length">
      <div class="text-sm">저장된 코디일지가 없습니다.</div>
    </sl-card>

    <div v-else class="flex flex-col gap-3">
      <div v-for="group in wearLogDateGroups" :key="group.wornDate" class="flex flex-col gap-2">
        <div class="px-1 text-sm font-semibold">{{ group.wornDate }}</div>

        <sl-card v-for="wearLog in group.logs" :key="wearLog.id">
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
              <sl-tag size="small" variant="success">총 {{ wearLog.itemCount }}개</sl-tag>
              <span class="text-xs">{{ wearLog.created.slice(11, 16) }}</span>
            </div>

            <div class="flex flex-wrap gap-2">
              <div v-for="item in wearLog.items" :key="item.id" class="flex items-center gap-2 rounded-xl p-2">
                <img v-if="item.imageUrl" class="h-10 w-10 rounded-lg object-cover" :src="item.imageUrl" alt="착용 옷 이미지" />
                <div v-else class="flex h-10 w-10 items-center justify-center rounded-lg">
                  <span class="text-xs">없음</span>
                </div>
                <span class="text-xs">{{ fetchCategoryLabel(item.category) }}</span>
              </div>
            </div>

            <div v-if="wearLog.note" class="text-sm">메모: {{ wearLog.note }}</div>
          </div>
        </sl-card>
      </div>
    </div>

    <AppBottomNav />
  </main>
</template>

<script setup lang="ts">
import { type ClothesCategoryOptions } from '@/api/pocketbase-types';
import { useAuthGuard } from '@/composables/auth-guard';
import { type WearLogItem, useWearLogs } from '@/composables/wear-logs';
import { fetchClothesCategoryLabel } from '@/ui/clothes.ui';
import { computed, onMounted } from 'vue';

type WearLogDateGroup = {
  logs: WearLogItem[];
  wornDate: string;
};

/* ======================= 변수 ======================= */
const { fetchAuthStateOrRedirect } = useAuthGuard();
const { wearLogList, isWearLogListLoading, fetchWearLogList } = useWearLogs();
const wearLogDateGroups = computed<WearLogDateGroup[]>(() => {
  const groupedMap = new Map<string, typeof wearLogList.value>();

  wearLogList.value.forEach((wearLog) => {
    const wornDate = wearLog.wornDate || '날짜 없음';
    const logs = groupedMap.get(wornDate) ?? [];
    logs.push(wearLog);
    groupedMap.set(wornDate, logs);
  });

  return Array.from(groupedMap.entries()).map(([wornDate, logs]) => ({
    logs,
    wornDate,
  }));
});
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(async () => {
  if (!(await fetchAuthStateOrRedirect())) {
    return;
  }

  await fetchWearLogList();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const fetchCategoryLabel = (category: ClothesCategoryOptions | null) => {
  return fetchClothesCategoryLabel(category);
};

const onClickRefreshWearLogButton = async () => {
  await fetchWearLogList();
};
/* ======================= 메서드 ======================= */
</script>
