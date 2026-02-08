<template>
  <main class="container mx-auto p-4">
    <div class="flex flex-col gap-6">
      <sl-dialog
        no-header
        :open="isSubmitting"
        @sl-request-close="onRequestCloseSubmitting"
      >
        <div class="flex flex-col items-center gap-3">
          <sl-spinner></sl-spinner>
          <div class="text-sm font-medium">투자 분석 중...</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">
            잠시만 기다려 주세요. 완료되면 자동으로 닫힙니다.
          </div>
        </div>
      </sl-dialog>

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
              :loading="isSubmitting"
              :disabled="!selectedFile || isSubmitting"
              @click="onClickAnalyze"
            >
              분석 시작
            </sl-button>
          </div>

          <div v-if="isSubmitting" class="text-xs text-slate-500 dark:text-slate-400">
            리포트를 생성 중입니다.
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

          <div class="grid gap-4 md:grid-cols-2">
            <div
              class="flex flex-col gap-3 rounded border border-slate-200 p-3 dark:border-slate-700"
            >
              <div class="text-sm font-semibold">자산 유형 비율</div>
              <div class="flex items-center gap-4">
                <div class="h-28 w-28">
                  <Pie v-if="assetTypeEntries.length" :data="assetTypeChartData" :options="pieOptions" />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center rounded-full bg-slate-200 text-xs text-slate-500"
                  >
                    없음
                  </div>
                </div>
                <div class="flex flex-1 flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                  <div v-if="!assetTypeEntries.length">데이터 없음</div>
                  <div
                    v-for="entry in assetTypeEntries"
                    :key="entry.label"
                    class="flex items-center justify-between"
                  >
                    <span>{{ entry.label }}</span>
                    <span class="text-slate-500 dark:text-slate-400">
                      {{ formatPercent(entry.value, assetTypeTotal) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="flex flex-col gap-3 rounded border border-slate-200 p-3 dark:border-slate-700"
            >
              <div class="text-sm font-semibold">주식 스타일 비율</div>
              <div class="flex items-center gap-4">
                <div class="h-28 w-28">
                  <Pie
                    v-if="stockStyleEntries.length"
                    :data="stockStyleChartData"
                    :options="pieOptions"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center rounded-full bg-slate-200 text-xs text-slate-500"
                  >
                    없음
                  </div>
                </div>
                <div class="flex flex-1 flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                  <div v-if="!stockStyleEntries.length">데이터 없음</div>
                  <div
                    v-for="entry in stockStyleEntries"
                    :key="entry.label"
                    class="flex items-center justify-between"
                  >
                    <span>{{ entry.label }}</span>
                    <span class="text-slate-500 dark:text-slate-400">
                      {{ formatPercent(entry.value, stockStyleTotal) }}
                    </span>
                  </div>
                </div>
              </div>
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
import { computed, ref } from 'vue';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Pie } from 'vue-chartjs';

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

type ChartEntry = {
  label: string;
  value: number;
};

const reportSummary = ref<ReportSummary | null>(null);

const { createReportFromImage } = useReports();
ChartJS.register(ArcElement, Tooltip, Legend);

const assetTypeEntries = computed(() => buildAssetTypeEntries(reportSummary.value));
const stockStyleEntries = computed(() => buildStockStyleEntries(reportSummary.value));
const assetTypeTotal = computed(() => sumEntries(assetTypeEntries.value));
const stockStyleTotal = computed(() => sumEntries(stockStyleEntries.value));
const assetTypeChartData = computed(() =>
  buildPieChartData(assetTypeEntries.value, ['#2563eb', '#14b8a6', '#f59e0b', '#94a3b8']),
);
const stockStyleChartData = computed(() =>
  buildPieChartData(stockStyleEntries.value, ['#0ea5e9', '#a855f7', '#22c55e', '#94a3b8']),
);
const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: { label?: string; parsed?: number }) => {
          const label = context.label ?? '';
          const value = context.parsed ?? 0;
          return `${label} ${formatKrw(value)}`;
        },
      },
    },
  },
};
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
  reportSummary.value = null;
};

const onClickSelectFile = () => {
  fileInputRef.value?.click();
};

const onRequestCloseSubmitting = (event: Event) => {
  if (isSubmitting.value) {
    event.preventDefault();
  }
};

const onClickAnalyze = () => {
  if (!selectedFile.value || isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;

  createReportFromImage(selectedFile.value)
    .then((response) => {
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

const formatPercent = (value: number, total: number) => {
  if (total <= 0) {
    return '0%';
  }
  return `${Math.round((value / total) * 100)}%`;
};

const sumEntries = (entries: ChartEntry[]) => {
  return entries.reduce((sum, entry) => sum + entry.value, 0);
};

const buildAssetTypeEntries = (summary: ReportSummary | null) => {
  if (!summary) {
    return [];
  }

  const totals = new Map<string, number>();
  summary.items.forEach((item) => {
    const label = normalizeAssetType(item);
    totals.set(label, (totals.get(label) ?? 0) + item.amountValue);
  });

  const orderedLabels = ['주식', 'ETF', '채권', '기타'];
  return orderedLabels
    .map((label) => ({ label, value: totals.get(label) ?? 0 }))
    .filter((entry) => entry.value > 0);
};

const buildStockStyleEntries = (summary: ReportSummary | null) => {
  if (!summary) {
    return [];
  }

  const totals = new Map<string, number>();
  summary.items.forEach((item) => {
    if (normalizeAssetType(item) !== '주식') {
      return;
    }
    const label = classifyStockStyle(item);
    totals.set(label, (totals.get(label) ?? 0) + item.amountValue);
  });

  const orderedLabels = ['배당', '성장', '채권', '기타'];
  return orderedLabels
    .map((label) => ({ label, value: totals.get(label) ?? 0 }))
    .filter((entry) => entry.value > 0);
};

const normalizeAssetType = (item: ReportItem) => {
  const text = item.assetType?.toLowerCase?.() ?? '';
  if (text.includes('etf')) {
    return 'ETF';
  }
  if (item.isBondLike || text.includes('bond') || text.includes('채권')) {
    return '채권';
  }
  if (text.includes('stock') || text.includes('equity') || text.includes('주식')) {
    return '주식';
  }
  return '기타';
};

const classifyStockStyle = (item: ReportItem) => {
  const style = item.style?.toLowerCase?.() ?? '';
  if (style.includes('dividend') || style.includes('배당')) {
    return '배당';
  }
  if (style.includes('growth') || style.includes('성장')) {
    return '성장';
  }
  if (item.isBondLike || style.includes('bond') || style.includes('채권')) {
    return '채권';
  }
  return '기타';
};

const buildPieChartData = (entries: ChartEntry[], colors: string[]) => {
  return {
    labels: entries.map((entry) => entry.label),
    datasets: [
      {
        data: entries.map((entry) => entry.value),
        backgroundColor: entries.map((_, index) => colors[index % colors.length] ?? '#94a3b8'),
        borderWidth: 0,
      },
    ],
  };
};
</script>
