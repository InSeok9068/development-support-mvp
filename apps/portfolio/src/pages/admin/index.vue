<template>
  <main class="container mx-auto px-4 py-6">
    <div class="flex flex-col gap-6">
      <sl-card class="w-full">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-4">
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <h2>관리자 대시보드</h2>
                <sl-badge variant="primary">Admin</sl-badge>
              </div>
              <div>매칭 실패 항목을 확인하고 개선 목록을 정리합니다.</div>
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

          <div class="flex flex-col gap-2">
            <sl-alert v-if="!isSuperuser" variant="warning" open>
              관리자 계정으로 로그인해야 사용할 수 있습니다.
            </sl-alert>
            <sl-alert v-else variant="success" open>
              관리자 권한이 확인되었습니다.
            </sl-alert>
          </div>
        </div>
      </sl-card>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <sl-card class="w-full">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <sl-icon name="exclamation-triangle"></sl-icon>
              <div>오늘의 미매칭</div>
            </div>
            <div>총 {{ matchFailureCount }}건</div>
          </div>
        </sl-card>

        <sl-card class="w-full">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <sl-icon name="arrow-repeat"></sl-icon>
              <div>동기화 상태</div>
            </div>
            <div v-if="isMatchFailureFetching">목록 갱신 중</div>
            <div v-else>최신 목록</div>
          </div>
        </sl-card>

        <sl-card class="w-full">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <sl-icon name="shield-lock"></sl-icon>
              <div>접근 권한</div>
            </div>
            <div v-if="isSuperuser">관리자 권한 확인</div>
            <div v-else>권한 필요</div>
          </div>
        </sl-card>
      </div>

      <sl-card class="w-full">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
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
                <div class="flex items-center justify-between gap-3">
                  <div class="flex flex-col gap-1">
                    <div>{{ item.rawName }}</div>
                    <div>카테고리: {{ resolveLabel(item.category, categoryLabels) }}</div>
                  </div>
                  <sl-badge variant="warning">매칭 실패</sl-badge>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                  <sl-tag size="small">금액 {{ formatNumber(item.amount) }}</sl-tag>
                  <sl-tag v-if="item.profit !== null" size="small">
                    손익 {{ formatNumber(item.profit) }}
                  </sl-tag>
                  <sl-tag v-if="item.profitRate !== null" size="small">
                    손익률 {{ formatRate(item.profitRate) }}
                  </sl-tag>
                  <sl-tag v-if="item.quantity !== null" size="small">
                    수량 {{ formatNumber(item.quantity) }}
                  </sl-tag>
                </div>

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
