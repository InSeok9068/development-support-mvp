<template>
  <main class="mx-auto min-h-screen max-w-[1500px] px-4 py-6 xl:px-6">
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 flex-col gap-1">
        <div class="text-lg font-semibold">KJCA 업무일지 자동 취합</div>
        <div class="truncate text-sm">
          PocketBase 로그인:
          <span v-if="isSignedIn && authRecord">{{ authRecord.email }}</span>
          <span v-else>미로그인</span>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <sl-button v-if="!isSignedIn" variant="default" @click="onClickGoSignIn">로그인</sl-button>
        <sl-button v-if="isSignedIn" variant="default" @click="onClickSignOut">로그아웃</sl-button>
      </div>
    </div>

    <sl-alert v-if="!isSignedIn" class="mt-4" variant="warning" open>
      먼저 PocketBase에 로그인한 뒤 자동 취합을 실행해주세요.
    </sl-alert>

    <div class="mt-6 grid grid-cols-[minmax(320px,380px)_minmax(0,1fr)] gap-6">
      <div class="flex min-w-0 flex-col gap-6">
        <sl-card class="min-w-0">
          <div class="flex flex-col gap-4">
            <div class="text-sm font-semibold">조회 조건</div>

            <sl-input v-model="scDay" label="조회일" type="date"></sl-input>
            <sl-switch :checked="testOneOnly" @sl-change="onChangeTestOneOnly"> 테스트 모드 (1건만 처리) </sl-switch>

            <sl-button
              variant="primary"
              size="large"
              :loading="isAutoRunning"
              :disabled="!isSignedIn"
              @click="onClickRunAutoAnalyze"
            >
              금일 자동 취합/비교 실행
            </sl-button>

            <sl-alert v-if="isAutoRunning" variant="neutral" open>
              <div class="flex items-center gap-2">
                <sl-spinner></sl-spinner>
                <div class="text-sm">팀장 일지 스크랩/분석/저장을 진행 중입니다.</div>
              </div>
              <sl-progress-bar class="mt-2" indeterminate></sl-progress-bar>
            </sl-alert>

            <sl-alert v-if="autoNoticeMessage" variant="success" open>{{ autoNoticeMessage }}</sl-alert>
            <sl-alert v-if="autoErrorMessage" variant="danger" open>{{ autoErrorMessage }}</sl-alert>
            <sl-alert v-if="autoWarnings.length > 0" variant="warning" open>
              <div class="text-sm">일부 항목은 자동 보정/스킵되었습니다.</div>
              <div class="mt-2 flex max-h-40 flex-col gap-1 overflow-auto text-sm">
                <div v-for="(warning, index) in autoWarnings" :key="`warning-${index}`">- {{ warning }}</div>
              </div>
            </sl-alert>
          </div>
        </sl-card>

        <sl-card class="min-w-0">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-semibold">팀장 목록</div>
              <div class="text-sm">총 {{ teamLeadRows.length }}건</div>
            </div>

            <div class="text-sm">
              접근 상태:
              <sl-badge v-if="lastDiaryAccessible === true" variant="success">성공</sl-badge>
              <sl-badge v-if="lastDiaryAccessible === false" variant="danger">실패</sl-badge>
              <span v-if="lastDiaryAccessible === null">-</span>
            </div>

            <div v-if="teamLeadRows.length === 0" class="text-sm">조회 결과가 없습니다.</div>

            <div v-else class="max-h-[calc(100vh-360px)] overflow-x-hidden overflow-y-auto">
              <div class="grid grid-cols-[minmax(0,1fr)_48px_56px] gap-2 text-sm">
                <div class="font-semibold">부서</div>
                <div class="font-semibold">직책</div>
                <div class="font-semibold">성명</div>
                <template v-for="row in teamLeadRows" :key="`${row.dept}-${row.staffName}`">
                  <div class="break-words">{{ row.dept }}</div>
                  <div class="break-words">{{ row.position }}</div>
                  <div class="break-words">{{ row.staffName }}</div>
                </template>
              </div>
            </div>
          </div>
        </sl-card>
      </div>

      <div class="flex min-w-0 flex-col gap-6">
        <sl-card v-if="deptWeekTables.length > 0" class="min-w-0">
          <div class="flex min-w-0 flex-col gap-4">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-semibold">금주 모집 계획/결과</div>
              <div class="text-sm">총 {{ deptWeekTables.length }}개 부서</div>
            </div>

            <div class="flex flex-col gap-3">
              <sl-details v-for="table in deptWeekTables" :key="`table-${table.dept}`" :summary="table.dept" open>
                <div class="mb-2 flex items-center justify-end">
                  <sl-button
                    variant="default"
                    size="small"
                    :loading="cacheClearingDept === table.dept"
                    :disabled="!isSignedIn || isAutoRunning || !!cacheClearingDept"
                    @click="onClickClearDeptCacheButton(table.dept)"
                  >
                    해당 부서 캐시 지우기
                  </sl-button>
                </div>

                <div class="min-w-0 overflow-x-auto">
                  <table class="w-full table-fixed border-2 border-solid text-sm">
                    <colgroup>
                      <col class="w-[68px]" />
                      <col class="w-[170px]" />
                      <col class="w-[190px]" />
                      <col class="w-[120px]" />
                      <col class="w-[100px]" />
                      <col class="w-[100px]" />
                      <col class="w-[110px]" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th colspan="7" class="border-2 border-solid px-3 py-2.5 text-left text-base font-semibold">
                          {{ buildDeptSummaryText(table.dept) }}
                        </th>
                      </tr>
                      <tr>
                        <th rowspan="2" class="border border-solid px-3 py-2.5 text-left text-base font-semibold">
                          요일
                        </th>
                        <th colspan="3" class="border border-solid px-3 py-2.5 text-left text-base font-semibold">
                          주간 홍보계획
                        </th>
                        <th class="border border-solid px-3 py-2.5 text-left text-base font-semibold">결과</th>
                        <th rowspan="2" class="border border-solid px-3 py-2.5 text-left text-base font-semibold">
                          담당자
                          <br />
                          (홍보)
                        </th>
                        <th rowspan="2" class="border border-solid px-3 py-2.5 text-left text-base font-semibold">
                          비고
                        </th>
                      </tr>
                      <tr>
                        <th class="border border-solid px-3 py-2.5 text-left text-base font-semibold">모집홍보처</th>
                        <th class="border border-solid px-3 py-2.5 text-left text-base font-semibold">모집 홍보내용</th>
                        <th class="border border-solid px-3 py-2.5 text-left text-base font-semibold">모집목표</th>
                        <th class="border border-solid px-3 py-2.5 text-left text-base font-semibold">모집 건수</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="weekday in WEEKDAY_ORDER" :key="`weekday-row-${table.dept}-${weekday}`">
                        <template
                          v-for="(row, rowIndex) in [getWeekdayMergedRow(table.rows, weekday)]"
                          :key="`weekday-row-data-${table.dept}-${weekday}-${rowIndex}`"
                        >
                          <tr :class="{ 'font-semibold': isFocusWeekday(weekday, table.todayWeekday) }">
                            <td
                              class="border border-solid px-3 py-2.5 text-left align-middle break-words whitespace-normal"
                            >
                              {{ weekdayLabelMap[weekday] }}
                              <sl-badge v-if="isFocusWeekday(weekday, table.todayWeekday)" variant="primary" pill
                                >오늘</sl-badge
                              >
                            </td>
                            <td
                              class="border border-solid px-3 py-2.5 text-left align-middle break-words whitespace-normal"
                            >
                              {{ row.channelName || '' }}
                            </td>
                            <td
                              class="border border-solid px-3 py-2.5 text-left align-middle break-words whitespace-normal"
                            >
                              {{ row.promotionContent || '' }}
                            </td>
                            <td
                              class="border border-solid px-3 py-2.5 text-left align-middle break-words whitespace-normal"
                            >
                              {{ row.targetText || '' }}
                            </td>
                            <td
                              class="border border-solid px-3 py-2.5 text-left align-middle break-words whitespace-normal"
                            >
                              {{ row.recruitCountText || '' }}
                            </td>
                            <td
                              class="border border-solid px-3 py-2.5 text-left align-middle break-words whitespace-normal"
                            >
                              {{ row.ownerName || '' }}
                            </td>
                            <td
                              class="border border-solid px-3 py-2.5 text-left align-middle break-words whitespace-normal"
                            >
                              {{ row.note || '' }}
                            </td>
                          </tr>
                        </template>
                      </template>
                    </tbody>
                  </table>
                </div>
              </sl-details>
            </div>
          </div>
        </sl-card>

        <sl-card v-if="analysisResults.length > 0" class="min-w-0">
          <div class="flex min-w-0 flex-col gap-4">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-semibold">AI 분석 상세</div>
              <div class="text-sm">총 {{ analysisResults.length }}건</div>
            </div>

            <div class="flex flex-col gap-3">
              <sl-details
                v-for="item in analysisResults"
                :key="`${item.dept}-${item.staffName}`"
                :summary="`${item.dept} / ${item.staffName}${item.ok ? '' : ' (실패)'}`"
              >
                <div class="flex min-w-0 flex-col gap-3 text-sm">
                  <div>
                    <sl-button
                      variant="text"
                      size="medium"
                      :href="item.printUrl"
                      target="_blank"
                      rel="noreferrer"
                      @click.stop
                    >
                      원본링크
                    </sl-button>
                  </div>

                  <sl-alert v-if="!item.ok" variant="danger" open>{{ item.error || '분석에 실패했습니다.' }}</sl-alert>

                  <div>
                    <div class="font-semibold">모집/홍보</div>
                    <div v-if="item.promotion.length === 0">-</div>
                    <div v-else class="flex flex-col gap-1">
                      <div v-for="(v, idx) in item.promotion" :key="`promotion-${idx}`" class="break-words">
                        - {{ v }}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div class="font-semibold">AI 추출 실적</div>
                    <div>
                      {{ item.recruiting.dailyActualCount === null ? '-' : `${item.recruiting.dailyActualCount}명` }}
                    </div>
                  </div>
                </div>
              </sl-details>
            </div>
          </div>
        </sl-card>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuth } from '@/composables/useAuth';
import { useKjca } from '@/composables/useKjca';
import { readShoelaceChecked } from '@packages/ui';

type RecruitingWeekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

type TeamLeadRow = {
  dept: string;
  position: string;
  staffName: string;
  printUrl: string;
};

type RecruitingAnalyze = {
  monthTarget: number | null;
  monthAssignedCurrent: number | null;
  weekTarget: number | null;
  dailyPlan: Array<{
    weekday: RecruitingWeekday;
    channelName: string;
    promotionContent: string;
    targetCount: number | null;
    ownerName: string;
    note: string;
  }>;
  dailyActualCount: number | null;
};

type AnalysisItem = {
  dept: string;
  position: string;
  staffName: string;
  ok: boolean;
  error?: string;
  promotion: string[];
  vacation: string[];
  special: string[];
  recruiting: RecruitingAnalyze;
  printUrl: string;
};

type DeptWeekTableRow = {
  weekday: RecruitingWeekday;
  channelName: string;
  weeklyPlan: string;
  promotionContent: string;
  targetText: string;
  resultText: string;
  recruitCountText: string;
  ownerName: string;
  note: string;
  sortOrder: number;
};

type DeptWeekTable = {
  dept: string;
  todayWeekday: RecruitingWeekday;
  rows: DeptWeekTableRow[];
};

type DeptWeekdayMergedRow = {
  channelName: string;
  weeklyPlan: string;
  promotionContent: string;
  targetText: string;
  resultText: string;
  recruitCountText: string;
  ownerName: string;
  note: string;
};

const WEEKDAY_ORDER: RecruitingWeekday[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

const weekdayLabelMap: Record<RecruitingWeekday, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
};

/* ======================= 변수 ======================= */
const router = useRouter();
const { authRecord, isSignedIn, signOut } = useAuth();
const { fetchStaffDiaryCollectWeekly, fetchStaffDiaryAnalyzeCacheClear } = useKjca();

const scDay = ref(buildTodayText());
const testOneOnly = ref(false);
const isAutoRunning = ref(false);
const autoNoticeMessage = ref('');
const autoErrorMessage = ref('');
const autoWarnings = ref<string[]>([]);
const cacheClearingDept = ref('');

const lastDiaryAccessible = ref<boolean | null>(null);
const teamLeadRows = ref<TeamLeadRow[]>([]);
const analysisResults = ref<AnalysisItem[]>([]);
const deptWeekTables = ref<DeptWeekTable[]>([]);
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickGoSignIn = async () => {
  await router.push('/sign-in');
};

const onClickSignOut = () => {
  signOut();
};

const onChangeTestOneOnly = (event: Event) => {
  testOneOnly.value = readShoelaceChecked(event);
};

const onClickRunAutoAnalyze = async () => {
  autoNoticeMessage.value = '';
  autoErrorMessage.value = '';
  autoWarnings.value = [];
  isAutoRunning.value = true;

  try {
    const reportDate = String(scDay.value || buildTodayText()).trim();
    const collectResult = await fetchStaffDiaryCollectWeekly({
      reportDate,
      testOneOnly: testOneOnly.value,
    });

    lastDiaryAccessible.value = collectResult.isDiaryAccessible;
    teamLeadRows.value = (collectResult.teamLeadRows ?? []).map((row) => ({
      dept: String(row.dept ?? '').trim(),
      position: String(row.position ?? '').trim(),
      staffName: String(row.staffName ?? '').trim(),
      printUrl: String(row.printUrl ?? '').trim(),
    }));

    analysisResults.value = (collectResult.analysisResults ?? []).map((item) => ({
      dept: item.dept,
      position: item.position,
      staffName: item.staffName,
      ok: item.ok !== false,
      error: item.error,
      promotion: item.promotion ?? [],
      vacation: item.vacation ?? [],
      special: item.special ?? [],
      recruiting: normalizeRecruiting(item.recruiting),
      printUrl: item.printUrl,
    }));

    deptWeekTables.value = normalizeDeptWeekTables(collectResult.deptWeekTables);
    autoWarnings.value = Array.isArray(collectResult.warnings)
      ? collectResult.warnings.map((item) => String(item ?? '').trim()).filter((item) => !!item)
      : [];

    const alertMessage = String(collectResult.alertMessage ?? '').trim();
    autoNoticeMessage.value = alertMessage || `자동 취합 완료 (${deptWeekTables.value.length}개 부서)`;
  } catch (error) {
    autoErrorMessage.value = readErrorMessage(error);
  } finally {
    isAutoRunning.value = false;
  }
};

const onClickClearDeptCacheButton = async (dept: string) => {
  const safeDept = String(dept ?? '').trim();
  if (!safeDept) return;
  if (cacheClearingDept.value) return;

  autoNoticeMessage.value = '';
  autoErrorMessage.value = '';
  cacheClearingDept.value = safeDept;

  try {
    const reportDate = String(scDay.value || buildTodayText()).trim();
    const clearResult = await fetchStaffDiaryAnalyzeCacheClear({
      reportDate,
      dept: safeDept,
    });

    analysisResults.value = analysisResults.value.filter((item) => String(item.dept ?? '').trim() !== safeDept);

    const deletedCount = Math.max(0, Math.trunc(Number(clearResult.deletedCount ?? 0)));
    autoNoticeMessage.value =
      deletedCount > 0
        ? `${safeDept} 캐시 ${deletedCount}건을 삭제했습니다.`
        : `${safeDept} 캐시가 없어 삭제할 항목이 없습니다.`;
  } catch (error) {
    autoErrorMessage.value = readErrorMessage(error);
  } finally {
    cacheClearingDept.value = '';
  }
};
/* ======================= 메서드 ======================= */

function readErrorMessage(error: unknown): string {
  const message = (error as { message?: string } | null)?.message;
  return message ? String(message) : `${error}`;
}

function buildTodayText() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeWeekday(value: unknown): RecruitingWeekday | null {
  const text = String(value ?? '')
    .trim()
    .toLowerCase();
  if (text === 'mon' || text === 'monday' || text === '월') return 'mon';
  if (text === 'tue' || text === 'tuesday' || text === '화') return 'tue';
  if (text === 'wed' || text === 'wednesday' || text === '수') return 'wed';
  if (text === 'thu' || text === 'thursday' || text === '목') return 'thu';
  if (text === 'fri' || text === 'friday' || text === '금') return 'fri';
  return null;
}

function isFocusWeekday(weekday: RecruitingWeekday, todayWeekday: RecruitingWeekday): boolean {
  return weekday === todayWeekday;
}

function buildMonthLabel(dateText: string): string {
  const text = String(dateText ?? '').trim();
  const matched = text.match(/^\d{4}-(\d{2})-\d{2}$/);
  if (!matched) return '금월';
  const month = Number(matched[1]);
  if (!Number.isFinite(month) || month < 1 || month > 12) return '금월';
  return `${month}월`;
}

function buildDeptSummaryText(dept: string): string {
  const item = analysisResults.value.find((row) => row.dept === dept && row.ok);
  const monthTarget = item?.recruiting?.monthTarget ?? null;
  const monthAssignedCurrent = item?.recruiting?.monthAssignedCurrent ?? null;
  const monthLabel = buildMonthLabel(scDay.value);

  const monthTargetText = monthTarget === null ? '-' : `${monthTarget}건`;
  const monthAssignedText = monthAssignedCurrent === null ? '-' : `${monthAssignedCurrent}명`;

  return `월 배정목표 : ${monthTargetText} / ${monthLabel} 현재 달성 : 배정 ${monthAssignedText}`;
}

function getWeekdayMergedRow(rows: DeptWeekTableRow[], weekday: RecruitingWeekday): DeptWeekdayMergedRow {
  const items = rows.filter((row) => row.weekday === weekday).sort((a, b) => a.sortOrder - b.sortOrder);

  const joinValues = (extractor: (row: DeptWeekTableRow) => string) =>
    items
      .map((row) => String(extractor(row) ?? '').trim())
      .filter((text) => !!text)
      .join(' / ');

  return {
    channelName: joinValues((row) => row.channelName),
    weeklyPlan: joinValues((row) => row.weeklyPlan),
    promotionContent: joinValues((row) => row.promotionContent),
    targetText: joinValues((row) => row.targetText),
    resultText: joinValues((row) => row.resultText),
    recruitCountText: joinValues((row) => row.recruitCountText),
    ownerName: joinValues((row) => row.ownerName),
    note: joinValues((row) => row.note),
  };
}

function normalizeNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.trunc(parsed));
}

function normalizeRecruiting(value: unknown): RecruitingAnalyze {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const rawDailyPlan = Array.isArray(source.dailyPlan) ? source.dailyPlan : [];

  const dailyPlan = rawDailyPlan
    .map((row) => {
      const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      const weekday = normalizeWeekday(item.weekday);
      if (!weekday) return null;

      return {
        weekday,
        channelName: String(item.channelName ?? '').trim(),
        promotionContent: String(item.promotionContent ?? '').trim(),
        targetCount: normalizeNullableInt(item.targetCount),
        ownerName: String(item.ownerName ?? '').trim(),
        note: String(item.note ?? '').trim(),
      };
    })
    .filter((row): row is RecruitingAnalyze['dailyPlan'][number] => !!row);

  return {
    monthTarget: normalizeNullableInt(source.monthTarget),
    monthAssignedCurrent: normalizeNullableInt(source.monthAssignedCurrent),
    weekTarget: normalizeNullableInt(source.weekTarget),
    dailyPlan,
    dailyActualCount: normalizeNullableInt(source.dailyActualCount),
  };
}

function buildEmptyWeekTableRow(weekday: RecruitingWeekday): DeptWeekTableRow {
  return {
    weekday,
    channelName: '',
    weeklyPlan: '',
    promotionContent: '',
    targetText: '',
    resultText: '',
    recruitCountText: '',
    ownerName: '',
    note: '',
    sortOrder: 0,
  };
}

function normalizeDeptWeekTables(value: unknown): DeptWeekTable[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      const todayWeekday = normalizeWeekday(source.todayWeekday) ?? 'fri';
      const rowsSource = Array.isArray(source.rows) ? source.rows : [];

      const normalizedRows = rowsSource
        .map((row) => {
          const rowData = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
          const weekday = normalizeWeekday(rowData.weekday);
          if (!weekday) return null;

          return {
            weekday,
            channelName: String(rowData.channelName ?? '').trim(),
            weeklyPlan: String(rowData.weeklyPlan ?? '').trim(),
            promotionContent: String(rowData.promotionContent ?? '').trim(),
            targetText: String(rowData.targetText ?? '').trim(),
            resultText: String(rowData.resultText ?? '').trim(),
            recruitCountText: String(rowData.recruitCountText ?? '').trim(),
            ownerName: String(rowData.ownerName ?? '').trim(),
            note: String(rowData.note ?? '').trim(),
            sortOrder: Math.max(0, Math.trunc(Number(rowData.sortOrder || 0))),
          } satisfies DeptWeekTableRow;
        })
        .filter((row): row is DeptWeekTableRow => !!row);

      const rows = WEEKDAY_ORDER.flatMap((weekday) => {
        const byWeekday = normalizedRows
          .filter((row) => row.weekday === weekday)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (byWeekday.length === 0) return [buildEmptyWeekTableRow(weekday)];
        return byWeekday;
      });

      return {
        dept: String(source.dept ?? '').trim(),
        todayWeekday,
        rows,
      } satisfies DeptWeekTable;
    })
    .filter((table) => !!table.dept)
    .sort((a, b) => a.dept.localeCompare(b.dept, 'ko'));
}
</script>
