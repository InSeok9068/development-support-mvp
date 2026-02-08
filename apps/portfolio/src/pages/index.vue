<template>
  <main class="container mx-auto p-4">
    <div class="flex flex-col gap-6">
      <sl-card class="w-full">
        <div class="flex flex-col gap-3">
          <h3 class="text-lg font-semibold">포트폴리오 리포트 자동 생성</h3>
          <p class="text-sm text-slate-600 dark:text-slate-300">
            투자 화면 스크린샷 1장만 업로드하면, 종목명과 금액을 자동으로 추출해
            국내/해외 구분과 함께 자산 현황을 정리한 리포트를 제공합니다.
          </p>
          <sl-divider></sl-divider>
          <div class="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div class="font-medium text-slate-600 dark:text-slate-300">서비스 소개</div>
            <ul class="list-disc pl-4">
              <li>업로드 파일은 리포트 생성에만 사용되며 저장 목적의 수집은 하지 않습니다.</li>
              <li>결과는 요약 리포트로 제공되며, 추출된 항목을 바로 확인할 수 있습니다.</li>
              <li>처리 시간은 보통 수초이며, 파일 크기와 네트워크 환경에 따라 달라집니다.</li>
            </ul>
          </div>
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

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">투자 화면 스크린샷</span>
            <div class="flex items-center gap-3">
              <sl-button variant="default" @click="onClickSelectFile">
                <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                <sl-icon slot="prefix" name="upload"></sl-icon>
                파일 선택
              </sl-button>
              <span class="text-xs text-slate-500 dark:text-slate-400">
                {{ selectedFileName || '선택된 파일 없음' }}
              </span>
            </div>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onChangeUpload"
            />
            <span class="text-xs text-slate-500 dark:text-slate-400">
              한 장만 업로드 가능합니다.
            </span>
          </div>

          <div class="flex items-center gap-3">
            <sl-button
              variant="primary"
              :disabled="!selectedFile || isSubmitting"
              @click="onClickAnalyze"
            >
              분석 시작
            </sl-button>
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
const fileInputRef = ref<HTMLInputElement | null>(null);
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

const onClickSelectFile = () => {
  fileInputRef.value?.click();
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
