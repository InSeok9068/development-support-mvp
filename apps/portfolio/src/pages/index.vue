<template>
  <main class="container mx-auto p-4">
    <div class="flex flex-col gap-6">
      <sl-dialog
        no-header
        :open="isCreatingReport"
        @sl-request-close="onRequestCloseSubmitting"
      >
        <div class="flex flex-col items-center gap-3">
          <sl-spinner></sl-spinner>
          <div>분석 진행 중입니다.</div>
          <div>완료되면 자동으로 닫힙니다.</div>
        </div>
      </sl-dialog>

      <div class="flex items-center justify-end">
        <sl-dropdown>
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <sl-icon-button slot="trigger" name="list" label="메뉴"></sl-icon-button>
          <sl-menu>
            <sl-menu-item v-if="!isAuth" @click="onClickGoSignin">
              로그인
            </sl-menu-item>
            <sl-menu-item v-if="isAuth" :disabled="!isSuperuser" @click="onClickGoAdmin">
              관리자 페이지
            </sl-menu-item>
            <sl-menu-item v-if="isAuth" @click="onClickSignout">
              로그아웃
            </sl-menu-item>
          </sl-menu>
        </sl-dropdown>
      </div>

      <sl-card class="w-full">
        <div class="flex flex-col gap-3">
          <h3>포트폴리오 리포트 자동 생성</h3>
          <p>
            투자 화면 스크린샷 1장만 업로드하면 자산명과 금액을 추출해 리포트를 제공합니다.
          </p>
          <sl-divider></sl-divider>
          <div class="flex flex-col gap-2">
            <div>서비스 소개</div>
            <div>업로드 파일은 리포트 생성에만 사용됩니다.</div>
            <div>AI가 인식한 항목과 매칭 결과를 함께 보여드립니다.</div>
          </div>
        </div>
      </sl-card>

      <sl-card class="w-full">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h4>이미지 업로드</h4>
            <div>지원 형식: JPG, PNG</div>
          </div>

          <div class="flex flex-col gap-2">
            <div>투자 화면 스크린샷</div>
            <div class="flex items-center gap-3">
              <sl-button variant="default" @click="onClickSelectFile">
                <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                <sl-icon slot="prefix" name="upload"></sl-icon>
                파일 선택
              </sl-button>
              <span>{{ selectedFileName || '선택된 파일 없음' }}</span>
            </div>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onChangeUpload"
            />
            <div>한 장만 업로드 가능합니다.</div>
          </div>

          <div class="flex items-center gap-3">
            <sl-button
              variant="primary"
              :loading="isCreatingReport"
              :disabled="!selectedFile || isCreatingReport"
              @click="onClickAnalyze"
            >
              분석 시작
            </sl-button>
          </div>
        </div>
      </sl-card>

      <sl-alert v-if="errorMessage" variant="danger" open>
        {{ errorMessage }}
      </sl-alert>

      <sl-card v-if="reportSummary" class="w-full">
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
              <h4>리포트 요약</h4>
              <div>추출된 항목 {{ reportItems.length }}개</div>
              <div v-if="unmatchedCount">매칭 실패 {{ unmatchedCount }}개</div>
            </div>
            <div class="text-right">
              <div>총 평가액</div>
              <div>{{ formatCurrency(reportSummary.totalValue, reportSummary.baseCurrency) }}</div>
              <div v-if="reportSummary.totalProfit !== null">
                손익 {{ formatCurrency(reportSummary.totalProfit, reportSummary.baseCurrency) }}
              </div>
              <div v-if="reportSummary.totalProfitRate !== null">
                손익률 {{ formatRate(reportSummary.totalProfitRate) }}
              </div>
            </div>
          </div>

          <sl-divider></sl-divider>

          <div class="flex flex-col gap-3">
            <div
              v-for="item in reportItems"
              :key="item.extractedAssetId"
              class="flex flex-col gap-3"
            >
              <div class="flex items-center justify-between">
                <div>{{ item.rawName }}</div>
                <sl-badge :variant="item.matched ? 'success' : 'warning'">
                  {{ item.matched ? '매칭 완료' : '매칭 실패' }}
                </sl-badge>
              </div>

              <div>카테고리: {{ resolveLabel(item.category, categoryLabels) }}</div>
              <div class="flex flex-wrap items-center gap-3">
                <div>금액 {{ formatCurrency(item.amount, reportSummary.baseCurrency) }}</div>
                <div v-if="item.profit !== null">
                  손익 {{ formatCurrency(item.profit, reportSummary.baseCurrency) }}
                </div>
                <div v-if="item.profitRate !== null">손익률 {{ formatRate(item.profitRate) }}</div>
                <div v-if="item.quantity !== null">수량 {{ formatNumber(item.quantity) }}</div>
              </div>

              <div v-if="item.matched && item.adminAsset" class="flex flex-col gap-2">
                <div>표준 자산: {{ item.adminAsset.name }}</div>
                <div>자산 구분: {{ resolveLabel(item.adminAsset.groupType, groupTypeLabels) }}</div>

                <div v-if="item.adminAsset.tags?.length" class="flex flex-col gap-1">
                  <div>성향 태그</div>
                  <div class="flex flex-wrap gap-1">
                    <sl-tag
                      v-for="tag in resolveLabelList(item.adminAsset.tags, tagLabels)"
                      :key="tag"
                      size="small"
                    >
                      {{ tag }}
                    </sl-tag>
                  </div>
                </div>

                <div v-if="item.adminAsset.sectors?.length" class="flex flex-col gap-1">
                  <div>섹터</div>
                  <div class="flex flex-wrap gap-1">
                    <sl-tag
                      v-for="sector in resolveLabelList(item.adminAsset.sectors, sectorLabels)"
                      :key="sector"
                      size="small"
                    >
                      {{ sector }}
                    </sl-tag>
                  </div>
                </div>
              </div>

              <sl-divider></sl-divider>
            </div>
          </div>
        </div>
      </sl-card>
    </div>
  </main>
</template>

<script setup lang="ts">
/* ======================= 변수 ======================= */
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuth } from '@/composables/useAuth';
import { useReports } from '@/composables/useReports';
import {
  categoryLabels,
  groupTypeLabels,
  resolveLabel,
  resolveLabelList,
  sectorLabels,
  tagLabels,
} from '@/ui/asset-labels';

const selectedFile = ref<File | null>(null);
const selectedFileName = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

const router = useRouter();
const { isAuth, isSuperuser, deleteAuthSession, fetchAuthState } = useAuth();
const { reportResult, isCreatingReport, createReportError, createReportFromImage } = useReports();

const reportSummary = computed(() => reportResult.value);
const reportItems = computed(() => reportSummary.value?.items ?? []);
const unmatchedCount = computed(() => reportItems.value.filter((item) => !item.matched).length);
const errorMessage = computed(() => {
  const error = createReportError.value;
  if (!error) {
    return '';
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '요청 처리 중 오류가 발생했습니다.';
});
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  fetchAuthState();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickGoSignin = () => {
  router.push('/sign');
};

const onClickGoAdmin = () => {
  if (!isSuperuser.value) {
    return;
  }
  router.push('/admin');
};

const onClickSignout = () => {
  deleteAuthSession();
};

const onChangeUpload = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0] ?? null;

  selectedFile.value = file;
  selectedFileName.value = file?.name ?? '';
  reportResult.value = null;
};

const onClickSelectFile = () => {
  fileInputRef.value?.click();
};

const onRequestCloseSubmitting = (event: Event) => {
  if (isCreatingReport.value) {
    event.preventDefault();
  }
};

const onClickAnalyze = () => {
  if (!selectedFile.value || isCreatingReport.value) {
    return;
  }

  createReportFromImage(selectedFile.value);
};
/* ======================= 메서드 ======================= */

const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

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
