<template>
  <main class="container mx-auto p-4">
    <div class="flex flex-col gap-6">
      <sl-card class="w-full">
        <div class="flex flex-col gap-3">
          <h3 class="text-lg font-semibold">한 장의 사진으로 자산 리포트</h3>
          <p class="text-sm text-slate-600 dark:text-slate-300">
            토스 투자 화면 스크린샷 1장을 올리면 AI가 종목명과 금액을 추출하고,
            국내/해외 구분과 함께 자산 현황 리포트를 만들어줍니다.
          </p>
        </div>
      </sl-card>

      <sl-card class="w-full">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h4 class="font-semibold">이미지 업로드</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              지원 형식: JPG, PNG. 개인정보가 포함되지 않은 화면을 권장합니다.
            </p>
          </div>

          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium">투자 화면 스크린샷</span>
            <input type="file" accept="image/*" @change="onChangeUpload" />
            <span class="text-xs text-slate-500 dark:text-slate-400">
              한 장만 업로드 가능합니다.
            </span>
          </label>

          <div class="flex items-center gap-3">
            <sl-button
              variant="primary"
              :disabled="!selectedFile || isSubmitting"
              @click="onClickAnalyze"
            >
              분석 시작
            </sl-button>
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {{ selectedFileName || '선택된 파일 없음' }}
            </span>
          </div>

          <div v-if="isSubmitting" class="text-xs text-slate-500 dark:text-slate-400">
            리포트를 생성 중입니다.
          </div>

          <div v-if="reportResult" class="text-xs text-slate-500 dark:text-slate-400">
            {{ reportResult }}
          </div>
        </div>
      </sl-card>

      <sl-card v-if="reportSummary" class="w-full">
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-1">
              <h4 class="font-semibold">리포트 요약</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                추출된 종목 {{ reportSummary.items.length }}개
              </p>
            </div>
            <div class="text-right">
              <div class="text-xs text-slate-500 dark:text-slate-400">총 평가액</div>
              <div class="text-lg font-semibold">{{ formatKrw(reportSummary.totalValue) }}</div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div
              v-for="item in reportSummary.items"
              :key="item.name"
              class="flex items-center justify-between rounded border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              <div class="flex flex-col gap-1">
                <div class="font-semibold">{{ item.name }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">
                  {{ buildMetaText(item) }}
                </div>
              </div>
              <div class="text-right">
                <div class="font-semibold">{{ formatKrw(item.amountValue) }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ item.amountText }}</div>
              </div>
            </div>
          </div>
        </div>
      </sl-card>
    </div>
  </main>
</template>

<script setup lang="ts">
/* ======================= 변수 ======================= */
import { ref } from 'vue';

import { useReports } from '@/composables/useReports';

const selectedFile = ref<File | null>(null);
const selectedFileName = ref('');
const isSubmitting = ref(false);
type ReportItem = {
  name: string;
  amountText: string;
  amountValue: number;
  region: string;
  assetType: string;
  sector?: string;
  style?: string;
  ticker?: string;
  exchange?: string;
  isBondLike?: boolean;
};

type ReportSummary = {
  totalValue: number;
  items: ReportItem[];
};

const reportResult = ref('');
const reportSummary = ref<ReportSummary | null>(null);

const { createReportFromImage } = useReports();
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onChangeUpload = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0] ?? null;

  selectedFile.value = file;
  selectedFileName.value = file?.name ?? '';
  reportResult.value = '';
  reportSummary.value = null;
};

const onClickAnalyze = () => {
  if (!selectedFile.value || isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;

  createReportFromImage(selectedFile.value)
    .then((response) => {
      reportResult.value = `리포트 ID: ${response.reportId}`;
      if (response.items && typeof response.totalValue === 'number') {
        reportSummary.value = {
          totalValue: response.totalValue,
          items: response.items,
        };
      } else {
        reportSummary.value = null;
      }
    })
    .finally(() => {
      isSubmitting.value = false;
    });
};
/* ======================= 메서드 ======================= */

const formatKrw = (value: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

const buildMetaText = (item: ReportItem) => {
  const tokens = [
    item.region,
    item.assetType,
    item.ticker,
    item.exchange,
    item.sector,
    item.style,
    item.isBondLike ? 'bond-like' : '',
  ].filter(Boolean);
  return tokens.join(' · ');
};
</script>
