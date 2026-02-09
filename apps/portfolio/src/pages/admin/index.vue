<template>
  <main class="container mx-auto p-4">
    <div class="flex flex-col gap-4">
      <sl-card class="w-full">
        <div class="flex flex-col gap-3">
          <h3>관리자 메뉴</h3>
          <div class="flex flex-col gap-2">
            <sl-alert v-if="!isSuperuser" variant="warning" open>
              관리자 계정으로 로그인해야 사용할 수 있습니다.
            </sl-alert>
            <sl-alert v-else variant="success" open>
              관리자 권한이 확인되었습니다.
            </sl-alert>
          </div>

          <div class="flex items-center gap-2">
            <sl-button variant="default" @click="onClickBack">
              돌아가기
            </sl-button>
            <sl-button v-if="isAuth" variant="default" @click="onClickSignout">
              로그아웃
            </sl-button>
          </div>
        </div>
      </sl-card>

      <sl-card class="w-full">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
              <h3>매칭 실패 목록</h3>
              <div>총 {{ matchFailureCount }}건</div>
            </div>
            <sl-button
              variant="default"
              size="small"
              :loading="isMatchFailureFetching"
              :disabled="!isSuperuser"
              @click="onClickRefresh"
            >
              새로고침
            </sl-button>
          </div>

          <sl-alert v-if="!isSuperuser" variant="warning" open>
            관리자 권한이 필요합니다.
          </sl-alert>

          <template v-else>
            <div v-if="isMatchFailureLoading">불러오는 중입니다.</div>
            <div v-else-if="!matchFailureList.length">매칭 실패 항목이 없습니다.</div>
            <div v-else class="flex flex-col gap-3">
              <div v-for="item in matchFailureList" :key="item.id" class="flex flex-col gap-2">
                <div>{{ item.rawName }}</div>
                <div>카테고리: {{ resolveLabel(item.category, categoryLabels) }}</div>
                <div>금액: {{ formatNumber(item.amount) }}</div>
                <div v-if="item.profit !== null">손익: {{ formatNumber(item.profit) }}</div>
                <div v-if="item.profitRate !== null">손익률: {{ formatRate(item.profitRate) }}</div>
                <div v-if="item.quantity !== null">수량: {{ formatNumber(item.quantity) }}</div>
                <div>리포트 ID: {{ item.reportId }}</div>
                <sl-divider></sl-divider>
              </div>
            </div>
          </template>
        </div>
      </sl-card>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useAuth } from '@/composables/useAuth';
import { useMatchFailures } from '@/composables/useMatchFailures';
import { categoryLabels, resolveLabel } from '@/ui/asset-labels';

/* ======================= 변수 ======================= */
const router = useRouter();
const { isAuth, isSuperuser, deleteAuthSession, fetchAuthState } = useAuth();
const matchFailureEnabled = computed(() => isSuperuser.value);
const {
  matchFailureList,
  matchFailureCount,
  isMatchFailureLoading,
  isMatchFailureFetching,
  fetchMatchFailureList,
} = useMatchFailures(matchFailureEnabled);
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  fetchAuthState();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickBack = () => {
  router.push('/');
};

const onClickSignout = () => {
  deleteAuthSession();
  router.push('/');
};

const onClickRefresh = () => {
  fetchMatchFailureList();
};
/* ======================= 메서드 ======================= */

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return new Intl.NumberFormat('ko-KR').format(value);
};

const formatRate = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value)}%`;
};
</script>
