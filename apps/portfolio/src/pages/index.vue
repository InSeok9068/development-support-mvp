<template>
  <main class="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -left-28 top-[-8rem] h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl"></div>
      <div class="absolute right-[-8rem] top-20 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl"></div>
      <div class="absolute bottom-[-10rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl"></div>
    </div>

    <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <sl-dialog no-header :open="isCreatingReport" @sl-request-close="onRequestCloseSubmitting">
        <div class="flex flex-col items-center gap-3 py-2">
          <sl-spinner></sl-spinner>
          <div class="font-semibold">분석 진행 중입니다.</div>
          <div class="text-sm text-slate-500">완료되면 결과가 자동으로 반영됩니다.</div>
        </div>
      </sl-dialog>

      <header class="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur md:p-7">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <sl-tag size="small" variant="success">MVP</sl-tag>
              <sl-tag size="small">단일 화면</sl-tag>
              <sl-tag size="small" variant="warning">스크린샷 분석</sl-tag>
            </div>

            <div class="flex flex-col gap-2">
              <h1 class="text-2xl font-semibold tracking-tight md:text-4xl">내 자산, 오늘 바로 요약</h1>
              <p class="max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
                증권 앱 화면을 한 장 올리면 자산 구성, 손익, 매칭 품질까지 한 번에 정리합니다.
                투자 점검에 필요한 핵심만 빠르게 확인할 수 있습니다.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end">
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
        </div>
      </header>

      <section class="grid gap-4 lg:grid-cols-3">
        <article class="rounded-2xl border border-white/10 bg-slate-900/85 p-4">
          <div class="text-xs text-slate-400">처리 상태</div>
          <div class="mt-2 text-2xl font-semibold">{{ isCreatingReport ? '분석 중' : '대기 중' }}</div>
          <div class="mt-1 text-sm text-slate-300">{{ statusDescription }}</div>
        </article>

        <article class="rounded-2xl border border-white/10 bg-slate-900/85 p-4">
          <div class="text-xs text-slate-400">총 평가액</div>
          <div class="mt-2 text-2xl font-semibold">{{ totalValueText }}</div>
          <div class="mt-1 text-sm text-slate-300">분석 완료 후 최신 값으로 갱신됩니다.</div>
        </article>

        <article class="rounded-2xl border border-white/10 bg-slate-900/85 p-4">
          <div class="text-xs text-slate-400">매칭 품질</div>
          <div class="mt-2 text-2xl font-semibold">{{ matchingRateText }}</div>
          <div class="mt-1 text-sm text-slate-300">자산명 매칭 성공률 기준</div>
        </article>
      </section>

      <section class="grid gap-5 xl:grid-cols-[1.1fr_1.9fr]">
        <sl-card class="w-full">
          <div class="flex flex-col gap-5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex flex-col gap-1">
                <h2 class="text-lg font-semibold">분석 시작</h2>
                <p class="text-sm text-slate-500">투자 화면 캡처 1장을 업로드하세요.</p>
              </div>
              <sl-badge variant="primary">필수</sl-badge>
            </div>

            <sl-divider></sl-divider>

            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2 text-sm font-medium">
                <sl-icon name="image"></sl-icon>
                <span>투자 화면 스크린샷</span>
              </div>

              <div class="rounded-xl border border-slate-200 p-3">
                <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div class="text-sm text-slate-600">
                    {{ selectedFileName || '선택된 파일 없음' }}
                  </div>
                  <sl-button variant="default" @click="onClickSelectFile">
                    <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                    <sl-icon slot="prefix" name="upload"></sl-icon>
                    파일 선택
                  </sl-button>
                </div>
              </div>

              <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onChangeUpload" />

              <div class="text-xs text-slate-500">JPG/PNG 파일 1장 업로드 가능</div>
            </div>

            <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <sl-button
                variant="primary"
                size="large"
                :loading="isCreatingReport"
                :disabled="!selectedFile || isCreatingReport"
                @click="onClickAnalyze"
              >
                분석 시작
              </sl-button>
              <div class="text-xs text-slate-500">평균 처리 시간 10~20초</div>
            </div>

            <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              업로드된 이미지는 리포트 생성 목적으로만 사용되며 처리 후 자동 폐기됩니다.
            </div>
          </div>
        </sl-card>

        <div class="flex flex-col gap-5">
          <sl-card class="w-full">
            <div class="flex flex-col gap-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex flex-col gap-1">
                  <h2 class="text-lg font-semibold">핵심 요약</h2>
                  <p class="text-sm text-slate-500">리포트가 생성되면 요약 인사이트가 표시됩니다.</p>
                </div>
                <sl-badge :variant="profitBadgeVariant">{{ profitText }}</sl-badge>
              </div>

              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="text-xs text-slate-500">추출 자산</div>
                  <div class="mt-1 text-lg font-semibold">{{ reportItems.length }}개</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="text-xs text-slate-500">매칭 실패</div>
                  <div class="mt-1 text-lg font-semibold">{{ unmatchedCount }}개</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="text-xs text-slate-500">손익</div>
                  <div class="mt-1 text-lg font-semibold">{{ profitValueText }}</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="text-xs text-slate-500">손익률</div>
                  <div class="mt-1 text-lg font-semibold">{{ profitRateText }}</div>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between text-sm">
                  <span>자산명 매칭 성공률</span>
                  <span class="font-medium">{{ matchingRateText }}</span>
                </div>
                <sl-progress-bar :value="matchingRate"></sl-progress-bar>
              </div>
            </div>
          </sl-card>

          <sl-alert v-if="errorMessage" variant="danger" open>
            {{ errorMessage }}
          </sl-alert>

          <sl-card v-if="reportItems.length" class="w-full">
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between gap-4">
                <h3 class="text-base font-semibold">카테고리 비중</h3>
                <span class="text-xs text-slate-500">평가액 기준</span>
              </div>

              <div class="flex flex-col gap-3">
                <div
                  v-for="entry in categoryBreakdown"
                  :key="entry.key"
                  class="grid items-center gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[8rem_1fr_auto]"
                >
                  <div class="text-sm font-medium">{{ entry.label }}</div>
                  <sl-progress-bar :value="entry.ratio"></sl-progress-bar>
                  <div class="text-sm text-slate-600">{{ entry.ratioText }}</div>
                </div>
              </div>
            </div>
          </sl-card>

          <sl-card v-if="topAssets.length" class="w-full">
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between gap-4">
                <h3 class="text-base font-semibold">상위 자산 5</h3>
                <span class="text-xs text-slate-500">평가액 순</span>
              </div>

              <div class="flex flex-col gap-2">
                <div
                  v-for="(asset, index) in topAssets"
                  :key="asset.extractedAssetId"
                  class="grid items-center gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[auto_1fr_auto_auto]"
                >
                  <sl-badge variant="neutral">{{ index + 1 }}</sl-badge>
                  <div class="flex flex-col gap-1">
                    <span class="font-medium">{{ asset.rawName }}</span>
                    <span class="text-xs text-slate-500">{{ resolveLabel(asset.category, categoryLabels) }}</span>
                  </div>
                  <span class="text-sm font-medium">{{ formatCurrency(asset.amount, baseCurrency) }}</span>
                  <sl-badge :variant="asset.matched ? 'success' : 'warning'">
                    {{ asset.matched ? '매칭 완료' : '매칭 실패' }}
                  </sl-badge>
                </div>
              </div>
            </div>
          </sl-card>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
/* ======================= 변수 ======================= */
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuth } from '@/composables/useAuth';
import { useReports } from '@/composables/useReports';
import { categoryLabels, resolveLabel } from '@/ui/asset-labels';

const selectedFile = ref<File | null>(null);
const selectedFileName = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

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
  if (!reportItems.value.length || !reportSummary.value?.totalValue) {
    return [];
  }

  const amountByCategory = new Map<string, number>();

  reportItems.value.forEach((item) => {
    const previous = amountByCategory.get(item.category) ?? 0;
    amountByCategory.set(item.category, previous + item.amount);
  });

  const totalValue = reportSummary.value.totalValue;

  return [...amountByCategory.entries()]
    .map(([key, amount]) => {
      const ratio = Math.round((amount / totalValue) * 100);
      return {
        key,
        amount,
        label: resolveLabel(key, categoryLabels),
        ratio,
        ratioText: `${ratio}%`,
      };
    })
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 6);
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

const formatRate = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value)}%`;
};
</script>
