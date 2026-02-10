<template>
  <main class="min-h-screen bg-slate-100 pb-28 text-slate-900">
    <div class="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-4 sm:px-5">
      <sl-dialog no-header :open="isCreatingReport" @sl-request-close="onRequestCloseSubmitting">
        <div class="flex flex-col items-center gap-3 py-2">
          <sl-spinner></sl-spinner>
          <div class="font-semibold">분석 진행 중입니다.</div>
          <div class="text-sm text-slate-500">완료되면 결과가 자동으로 반영됩니다.</div>
        </div>
      </sl-dialog>

      <header class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <sl-tag size="small" variant="primary">PORTFOLIO</sl-tag>
              <sl-tag size="small" variant="success">{{ isCreatingReport ? '분석 중' : '준비 완료' }}</sl-tag>
            </div>
            <div>
              <h1 class="text-xl font-semibold leading-tight">모바일 자산 스냅샷 분석</h1>
              <p class="mt-1 text-sm text-slate-600">
                스크린샷 1장으로 총 자산, 손익, 매칭 품질을 빠르게 점검합니다.
              </p>
            </div>
          </div>

          <sl-dropdown>
            <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
            <sl-icon-button slot="trigger" name="list" label="메뉴"></sl-icon-button>
            <sl-menu>
              <sl-menu-item v-if="!isAuth" @click="onClickGoSignin"> 로그인 </sl-menu-item>
              <sl-menu-item v-if="isAuth" :disabled="!isSuperuser" @click="onClickGoAdmin">
                관리자 페이지
              </sl-menu-item>
              <sl-menu-item v-if="isAuth" @click="onClickSignout"> 로그아웃 </sl-menu-item>
            </sl-menu>
          </sl-dropdown>
        </div>
      </header>

      <section class="grid grid-cols-2 gap-3">
        <article class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div class="text-xs text-slate-500">총 평가액</div>
          <div class="mt-2 text-lg font-semibold leading-tight">{{ totalValueText }}</div>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div class="text-xs text-slate-500">매칭 성공률</div>
          <div class="mt-2 text-lg font-semibold leading-tight">{{ matchingRateText }}</div>
        </article>
      </section>

      <sl-card class="w-full">
        <div class="flex flex-col gap-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold">이미지 업로드</h2>
              <p class="mt-1 text-sm text-slate-600">투자 앱 캡처를 업로드해 분석을 시작하세요.</p>
            </div>
            <sl-badge variant="primary">필수</sl-badge>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div class="flex items-center justify-between gap-2">
              <div class="truncate text-sm text-slate-700">
                {{ selectedFileName || '선택된 파일 없음' }}
              </div>
              <sl-button variant="default" size="small" @click="onClickSelectFile">
                <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                <sl-icon slot="prefix" name="upload"></sl-icon>
                파일 선택
              </sl-button>
            </div>
          </div>

          <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onChangeUpload" />

          <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            업로드 파일은 리포트 생성 후 자동 폐기됩니다.
          </div>

          <div class="text-xs text-slate-500">{{ statusDescription }}</div>
        </div>
      </sl-card>

      <sl-alert v-if="errorMessage" variant="danger" open>
        {{ errorMessage }}
      </sl-alert>

      <sl-card class="w-full">
        <div class="flex flex-col gap-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold">핵심 요약</h2>
              <p class="mt-1 text-sm text-slate-600">분석 결과 기반의 핵심 지표입니다.</p>
            </div>
            <sl-badge :variant="profitBadgeVariant">{{ profitText }}</sl-badge>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div class="text-xs text-slate-500">추출 자산</div>
              <div class="mt-1 text-sm font-semibold">{{ reportItems.length }}개</div>
            </div>
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div class="text-xs text-slate-500">매칭 실패</div>
              <div class="mt-1 text-sm font-semibold">{{ unmatchedCount }}개</div>
            </div>
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div class="text-xs text-slate-500">손익</div>
              <div class="mt-1 text-sm font-semibold">{{ profitValueText }}</div>
            </div>
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div class="text-xs text-slate-500">손익률</div>
              <div class="mt-1 text-sm font-semibold">{{ profitRateText }}</div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between text-sm">
              <span>자산명 매칭 성공률</span>
              <span class="font-semibold">{{ matchingRateText }}</span>
            </div>
            <sl-progress-bar :value="matchingRate"></sl-progress-bar>
          </div>
        </div>
      </sl-card>

      <sl-card v-if="reportItems.length" class="w-full">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-sm font-semibold">자산 분포 차트</h3>
            <span class="text-xs text-slate-500">평가액 기준</span>
          </div>

          <sl-tab-group :active-tab="activeBreakdownTabName" @sl-tab-show="onShowBreakdownTab">
            <sl-tab slot="nav" panel="category">Category</sl-tab>
            <sl-tab slot="nav" panel="profiles">Profiles</sl-tab>
            <sl-tab slot="nav" panel="tags">Tags</sl-tab>
            <sl-tab slot="nav" panel="sectors">Sectors</sl-tab>

            <sl-tab-panel name="category">
              <div v-if="categoryBreakdown.length" class="flex flex-col gap-3">
                <div class="h-56 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <Doughnut :data="categoryBreakdownChartData" :options="breakdownChartOptions"></Doughnut>
                </div>
                <div class="flex flex-col gap-2">
                  <div v-for="entry in categoryBreakdown" :key="`category-${entry.key}`" class="flex items-center justify-between text-xs">
                    <span class="truncate">{{ entry.label }}</span>
                    <span class="font-semibold">{{ entry.ratioText }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-slate-500">차트 데이터가 없습니다.</div>
            </sl-tab-panel>

            <sl-tab-panel name="profiles">
              <div v-if="profileBreakdown.length" class="flex flex-col gap-3">
                <div class="h-56 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <Doughnut :data="profileBreakdownChartData" :options="breakdownChartOptions"></Doughnut>
                </div>
                <div class="flex flex-col gap-2">
                  <div v-for="entry in profileBreakdown" :key="`profiles-${entry.key}`" class="flex items-center justify-between text-xs">
                    <span class="truncate">{{ entry.label }}</span>
                    <span class="font-semibold">{{ entry.ratioText }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-slate-500">차트 데이터가 없습니다.</div>
            </sl-tab-panel>

            <sl-tab-panel name="tags">
              <div v-if="tagBreakdown.length" class="flex flex-col gap-3">
                <div class="h-56 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <Doughnut :data="tagBreakdownChartData" :options="breakdownChartOptions"></Doughnut>
                </div>
                <div class="flex flex-col gap-2">
                  <div v-for="entry in tagBreakdown" :key="`tags-${entry.key}`" class="flex items-center justify-between text-xs">
                    <span class="truncate">{{ entry.label }}</span>
                    <span class="font-semibold">{{ entry.ratioText }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-slate-500">차트 데이터가 없습니다.</div>
            </sl-tab-panel>

            <sl-tab-panel name="sectors">
              <div v-if="sectorBreakdown.length" class="flex flex-col gap-3">
                <div class="h-56 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <Doughnut :data="sectorBreakdownChartData" :options="breakdownChartOptions"></Doughnut>
                </div>
                <div class="flex flex-col gap-2">
                  <div v-for="entry in sectorBreakdown" :key="`sectors-${entry.key}`" class="flex items-center justify-between text-xs">
                    <span class="truncate">{{ entry.label }}</span>
                    <span class="font-semibold">{{ entry.ratioText }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-slate-500">차트 데이터가 없습니다.</div>
            </sl-tab-panel>
          </sl-tab-group>
        </div>
      </sl-card>

      <sl-card v-if="topAssets.length" class="w-full">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-sm font-semibold">상위 자산 5</h3>
            <span class="text-xs text-slate-500">평가액 순</span>
          </div>

          <div class="flex flex-col gap-2">
            <div
              v-for="(asset, index) in topAssets"
              :key="asset.extractedAssetId"
              class="rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-center gap-2">
                  <sl-badge variant="neutral">{{ index + 1 }}</sl-badge>
                  <div class="flex min-w-0 flex-col">
                    <span class="truncate text-sm font-semibold">{{ asset.rawName }}</span>
                    <div v-if="asset.adminAsset" class="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                      <span class="font-semibold text-slate-700">Category:</span>
                      <span>{{ resolveLabel(asset.adminAsset.category, categoryLabels) }}</span>
                      <span class="font-semibold text-slate-700">Profiles:</span>
                      <span>{{ resolveLabel(asset.adminAsset.groupType, groupTypeLabels) }}</span>
                    </div>
                    <span v-else class="text-xs text-slate-500">{{ resolveLabel(asset.category, categoryLabels) }}</span>
                  </div>
                </div>
                <sl-badge :variant="asset.matched ? 'success' : 'warning'">
                  {{ asset.matched ? '매칭 완료' : '매칭 실패' }}
                </sl-badge>
              </div>
              <div class="mt-2 text-sm font-semibold">{{ formatCurrency(asset.amount, baseCurrency) }}</div>
              <div v-if="asset.adminAsset?.tags?.length" class="mt-1 text-xs text-slate-500">
                <span class="font-semibold text-slate-700">Tags:</span>
                {{ formatLabelList(resolveLabelList(asset.adminAsset.tags, tagLabels)) }}
              </div>
              <div v-if="asset.adminAsset?.sectors?.length" class="mt-1 text-xs text-slate-500">
                <span class="font-semibold text-slate-700">Sectors:</span>
                {{ formatLabelList(resolveLabelList(asset.adminAsset.sectors, sectorLabels)) }}
              </div>
            </div>
          </div>
        </div>
      </sl-card>
    </div>

    <div class="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-sm">
      <div class="mx-auto w-full max-w-xl">
        <sl-button
          variant="primary"
          size="large"
          class="w-full"
          :loading="isCreatingReport"
          :disabled="!selectedFile || isCreatingReport"
          @click="onClickAnalyze"
        >
          분석 시작
        </sl-button>
        <div class="mt-2 text-center text-xs text-slate-500">평균 처리 시간 10~20초</div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
/* ======================= 변수 ======================= */
import { ArcElement, Chart as ChartJS, Legend, Tooltip, type ChartData, type ChartOptions } from 'chart.js';
import { computed, onMounted, ref } from 'vue';
import { Doughnut } from 'vue-chartjs';
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

ChartJS.register(ArcElement, Tooltip, Legend);

type BreakdownTabName = 'category' | 'profiles' | 'tags' | 'sectors';
type BreakdownEntry = {
  key: string;
  label: string;
  amount: number;
  ratio: number;
  ratioText: string;
};

const selectedFile = ref<File | null>(null);
const selectedFileName = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);
const activeBreakdownTabName = ref<BreakdownTabName>('category');

const router = useRouter();
const { isAuth, isSuperuser, deleteAuthSession, fetchAuthState } = useAuth();
const { reportResult, isCreatingReport, createReportError, createReportFromImage } = useReports();

const reportSummary = computed(() => reportResult.value);
const reportItems = computed(() => reportSummary.value?.items ?? []);
const unmatchedCount = computed(() => reportItems.value.filter((item) => !item.matched).length);
const baseCurrency = computed(() => reportSummary.value?.baseCurrency ?? 'KRW');
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

const totalValueText = computed(() => {
  if (!reportSummary.value) {
    return '-';
  }
  return formatCurrency(reportSummary.value.totalValue, reportSummary.value.baseCurrency);
});

const profitValueText = computed(() => {
  if (!reportSummary.value || reportSummary.value.totalProfit === null) {
    return '-';
  }
  return formatCurrency(reportSummary.value.totalProfit, reportSummary.value.baseCurrency);
});

const profitRateText = computed(() => {
  if (!reportSummary.value || reportSummary.value.totalProfitRate === null) {
    return '-';
  }
  return formatRate(reportSummary.value.totalProfitRate);
});

const profitBadgeVariant = computed(() => {
  const value = reportSummary.value?.totalProfit;

  if (value === null || value === undefined) {
    return 'neutral';
  }
  if (value > 0) {
    return 'success';
  }
  if (value < 0) {
    return 'danger';
  }
  return 'neutral';
});

const profitText = computed(() => {
  const value = reportSummary.value?.totalProfit;

  if (value === null || value === undefined) {
    return '손익 정보 없음';
  }
  if (value > 0) {
    return '수익 구간';
  }
  if (value < 0) {
    return '손실 구간';
  }
  return '손익 보합';
});

const matchingRate = computed(() => {
  const items = reportItems.value;

  if (!items.length) {
    return 0;
  }

  const matchedCount = items.length - unmatchedCount.value;
  return Math.round((matchedCount / items.length) * 100);
});

const matchingRateText = computed(() => {
  return `${matchingRate.value}%`;
});

const statusDescription = computed(() => {
  if (isCreatingReport.value) {
    return 'OCR와 자산 매칭을 진행하고 있습니다.';
  }
  if (reportSummary.value) {
    return '최신 분석 결과가 반영되어 있습니다.';
  }
  return '스크린샷 업로드 후 분석을 시작하세요.';
});

const topAssets = computed(() => {
  return [...reportItems.value].sort((left, right) => right.amount - left.amount).slice(0, 5);
});

const categoryBreakdown = computed(() => {
  const amountByCategory = new Map<string, number>();
  reportItems.value.forEach((item) => {
    const previous = amountByCategory.get(item.category) ?? 0;
    amountByCategory.set(item.category, previous + item.amount);
  });
  return buildBreakdownEntries(amountByCategory, categoryLabels);
});

const profileBreakdown = computed(() => {
  const amountByProfile = new Map<string, number>();
  reportItems.value.forEach((item) => {
    if (!item.adminAsset) {
      return;
    }
    const key = item.adminAsset.groupType;
    const previous = amountByProfile.get(key) ?? 0;
    amountByProfile.set(key, previous + item.amount);
  });
  return buildBreakdownEntries(amountByProfile, groupTypeLabels);
});

const tagBreakdown = computed(() => {
  const amountByTag = new Map<string, number>();
  reportItems.value.forEach((item) => {
    const tags = item.adminAsset?.tags ?? [];
    if (!tags.length) {
      return;
    }
    const sharedAmount = item.amount / tags.length;
    tags.forEach((tag) => {
      const previous = amountByTag.get(tag) ?? 0;
      amountByTag.set(tag, previous + sharedAmount);
    });
  });
  return buildBreakdownEntries(amountByTag, tagLabels);
});

const sectorBreakdown = computed(() => {
  const amountBySector = new Map<string, number>();
  reportItems.value.forEach((item) => {
    const sectors = item.adminAsset?.sectors ?? [];
    if (!sectors.length) {
      return;
    }
    const sharedAmount = item.amount / sectors.length;
    sectors.forEach((sector) => {
      const previous = amountBySector.get(sector) ?? 0;
      amountBySector.set(sector, previous + sharedAmount);
    });
  });
  return buildBreakdownEntries(amountBySector, sectorLabels);
});

const categoryBreakdownChartData = computed(() => buildDoughnutChartData(categoryBreakdown.value));
const profileBreakdownChartData = computed(() => buildDoughnutChartData(profileBreakdown.value));
const tagBreakdownChartData = computed(() => buildDoughnutChartData(tagBreakdown.value));
const sectorBreakdownChartData = computed(() => buildDoughnutChartData(sectorBreakdown.value));

const breakdownChartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
};
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

const onShowBreakdownTab = (event: Event) => {
  const detail = (event as CustomEvent<{ name: BreakdownTabName }>).detail;
  activeBreakdownTabName.value = detail.name;
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

const formatRate = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value)}%`;
};

const formatLabelList = (values: string[]) => {
  return values.length ? values.join(', ') : '-';
};

const buildBreakdownEntries = (amountByKey: Map<string, number>, labelMap: Record<string, string>) => {
  const totalAmount = [...amountByKey.values()].reduce((sum, amount) => sum + amount, 0);
  if (totalAmount <= 0) {
    return [] as BreakdownEntry[];
  }

  return [...amountByKey.entries()]
    .map(([key, amount]) => {
      const ratio = (amount / totalAmount) * 100;
      return {
        key,
        label: resolveLabel(key, labelMap),
        amount,
        ratio,
        ratioText: `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(ratio)}%`,
      };
    })
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 8);
};

const chartColors = ['#0ea5e9', '#14b8a6', '#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#a855f7'];

const buildDoughnutChartData = (entries: BreakdownEntry[]): ChartData<'doughnut'> => ({
  labels: entries.map((entry) => entry.label),
  datasets: [
    {
      data: entries.map((entry) => Number(entry.amount.toFixed(2))),
      backgroundColor: entries.map((_, index) => chartColors[index % chartColors.length]),
      borderWidth: 0,
    },
  ],
});
</script>
