<template>
  <main class="mx-auto min-h-screen max-w-7xl px-10 py-6">
    <div class="flex items-start justify-between gap-6">
      <div class="flex flex-col gap-1">
        <div class="text-lg font-semibold">KJCA 업무일지</div>
        <div class="text-sm">
          PocketBase 로그인:
          <span v-if="isSignedIn && authRecord">{{ authRecord.name || authRecord.email }}</span>
          <span v-else>미로그인</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <sl-button v-if="!isSignedIn" variant="default" @click="onClickGoSignIn">로그인</sl-button>
        <sl-button v-if="!isSignedIn" variant="default" @click="onClickGoSignUp">회원가입</sl-button>
        <sl-button v-if="isSignedIn" variant="default" @click="onClickSignOut">로그아웃</sl-button>
      </div>
    </div>

    <sl-alert v-if="!isSignedIn" class="mt-4" variant="warning" open>
      먼저 PocketBase에 로그인한 뒤, 조회/분석을 진행해주세요.
    </sl-alert>

    <div class="mt-6 grid grid-cols-[460px_1fr] gap-6">
      <div class="flex flex-col gap-6">
        <sl-card>
          <div class="flex flex-col gap-4">
            <div class="text-sm font-semibold">조회 조건</div>

            <div class="grid grid-cols-2 gap-3">
              <sl-input v-model="scDayStart" label="조회 시작일" type="date"></sl-input>
              <sl-input v-model="scDayEnd" label="조회 종료일" type="date"></sl-input>
            </div>

            <div class="flex items-center justify-between gap-3">
              <sl-button variant="primary" :disabled="!isSignedIn" @click="onClickCallStaffAuthProbe">
                팀장 목록 조회
              </sl-button>

              <div class="text-sm">
                <sl-badge v-if="lastDiaryAccessible === true" variant="success">성공</sl-badge>
                <sl-badge v-if="lastDiaryAccessible === false" variant="danger">실패</sl-badge>
              </div>
            </div>
          </div>
        </sl-card>

        <sl-card>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-semibold">팀장 목록</div>
              <div class="text-sm">총 {{ teamLeadRows.length }}건</div>
            </div>

            <div v-if="teamLeadRows.length === 0" class="text-sm">조회 결과가 없습니다.</div>

            <div v-else class="flex flex-col gap-3">
              <div class="grid grid-cols-[1fr_72px_80px] gap-2 text-sm">
                <div class="font-semibold">부서</div>
                <div class="font-semibold">직책</div>
                <div class="font-semibold">성명</div>
              </div>

              <sl-divider></sl-divider>

              <div class="max-h-[calc(100vh-330px)] overflow-auto">
                <div class="grid grid-cols-[1fr_72px_80px] gap-2 text-sm">
                  <template v-for="row in teamLeadRows" :key="`${row.dept}-${row.staffName}`">
                    <div>{{ row.dept }}</div>
                    <div>{{ row.position }}</div>
                    <div>{{ row.staffName }}</div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </sl-card>
      </div>

      <div class="flex flex-col gap-6">
        <sl-card>
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-semibold">분석</div>
              <sl-switch :checked="testAnalyzeOneOnly" @sl-change="onChangeTestAnalyzeOneOnly">
                테스트 모드 (1건)
              </sl-switch>
            </div>

            <sl-button
              variant="primary"
              size="large"
              :loading="isAnalyzing"
              :disabled="!isSignedIn || teamLeadRows.length === 0"
              @click="onClickAnalyzeDiary"
            >
              팀장 일지 분석 ({{ analyzeTargetCount }}건)
            </sl-button>

            <sl-alert v-if="isAnalyzing" variant="neutral" open>
              <div class="flex items-center gap-2">
                <sl-spinner></sl-spinner>
                <div class="text-sm">AI가 분석 중입니다. 잠시만 기다려주세요.</div>
              </div>
              <sl-progress-bar class="mt-2" indeterminate></sl-progress-bar>
            </sl-alert>

            <sl-alert v-if="analysisNoticeMessage" variant="warning" open>{{ analysisNoticeMessage }}</sl-alert>
            <sl-alert v-if="analysisErrorMessage" variant="danger" open>{{ analysisErrorMessage }}</sl-alert>
          </div>
        </sl-card>

        <sl-card v-if="analysisResults.length > 0">
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-semibold">결과</div>
              <div class="text-sm">총 {{ analysisResults.length }}건</div>
            </div>

            <sl-tab-group>
              <sl-tab slot="nav" panel="merged">취합 버전</sl-tab>
              <sl-tab slot="nav" panel="detail">부서별 상세</sl-tab>

              <sl-tab-panel name="merged">
                <sl-tab-group>
                  <sl-tab slot="nav" panel="promo">홍보</sl-tab>
                  <sl-tab slot="nav" panel="vac">휴가</sl-tab>
                  <sl-tab slot="nav" panel="spec">특이사항</sl-tab>

                  <sl-tab-panel name="promo">
                    <div v-if="mergedPromotionLines.length === 0" class="text-sm">-</div>
                    <div v-else class="flex flex-col gap-1 text-sm">
                      <div v-for="(v, idx) in mergedPromotionLines" :key="`mp-${idx}`">- {{ v }}</div>
                    </div>
                  </sl-tab-panel>

                  <sl-tab-panel name="vac">
                    <div v-if="mergedVacationLines.length === 0" class="text-sm">-</div>
                    <div v-else class="flex flex-col gap-1 text-sm">
                      <div v-for="(v, idx) in mergedVacationLines" :key="`mv-${idx}`">- {{ v }}</div>
                    </div>
                  </sl-tab-panel>

                  <sl-tab-panel name="spec">
                    <div v-if="mergedSpecialLines.length === 0" class="text-sm">-</div>
                    <div v-else class="flex flex-col gap-1 text-sm">
                      <div v-for="(v, idx) in mergedSpecialLines" :key="`ms-${idx}`">- {{ v }}</div>
                    </div>
                  </sl-tab-panel>
                </sl-tab-group>
              </sl-tab-panel>

              <sl-tab-panel name="detail">
                <div class="flex flex-col gap-3">
                  <sl-details
                    v-for="item in analysisResults"
                    :key="`${item.dept}-${item.staffName}`"
                    :summary="`${item.dept} / ${item.position} / ${item.staffName}${item.ok ? '' : ' (실패)'}`"
                  >
                    <div class="flex flex-col gap-3 text-sm">
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

                      <sl-alert v-if="!item.ok" variant="danger" open>{{
                        item.error || '분석에 실패했습니다.'
                      }}</sl-alert>

                      <div>
                        <div class="font-semibold">홍보</div>
                        <div v-if="item.promotion.length === 0">-</div>
                        <div v-else class="flex flex-col gap-1">
                          <div v-for="(v, idx) in item.promotion" :key="`p-${idx}`">- {{ v }}</div>
                        </div>
                      </div>

                      <div>
                        <div class="font-semibold">휴가</div>
                        <div v-if="item.vacation.length === 0">-</div>
                        <div v-else class="flex flex-col gap-1">
                          <div v-for="(v, idx) in item.vacation" :key="`v-${idx}`">- {{ v }}</div>
                        </div>
                      </div>

                      <div>
                        <div class="font-semibold">특이사항</div>
                        <div v-if="item.special.length === 0">-</div>
                        <div v-else class="flex flex-col gap-1">
                          <div v-for="(v, idx) in item.special" :key="`s-${idx}`">- {{ v }}</div>
                        </div>
                      </div>
                    </div>
                  </sl-details>
                </div>
              </sl-tab-panel>
            </sl-tab-group>
          </div>
        </sl-card>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuth } from '@/composables/useAuth';
import { useKjca } from '@/composables/useKjca';
import { readShoelaceChecked } from '@packages/ui';

/* ======================= 변수 ======================= */
const router = useRouter();
const { authRecord, isSignedIn, signOut } = useAuth();
const { fetchStaffAuthProbe, fetchStaffDiaryAnalyze } = useKjca();
const scDayStart = ref(buildTodayText());
const scDayEnd = ref(buildTodayText());
const lastDiaryAccessible = ref<boolean | null>(null);
const teamLeadRows = ref<Array<{ dept: string; position: string; staffName: string; printUrl: string }>>([]);
const isAnalyzing = ref(false);
const testAnalyzeOneOnly = ref(false);
const analysisNoticeMessage = ref('');
const analysisErrorMessage = ref('');
const analysisResults = ref<
  Array<{
    dept: string;
    position: string;
    staffName: string;
    ok: boolean;
    error?: string;
    promotion: string[];
    vacation: string[];
    special: string[];
    printUrl: string;
  }>
>([]);

const normalizeDeptPrefix = (dept: string) => {
  const name = String(dept ?? '').trim();
  if (!name) return '[부서미상]';
  if (name.startsWith('[')) return name;
  return `[${name}]`;
};

const mergedPromotionLines = computed(() => {
  const lines: string[] = [];
  analysisResults.value
    .filter((item) => item.ok)
    .forEach((item) => {
      const prefix = normalizeDeptPrefix(item.dept);
      (item.promotion ?? []).forEach((v) => lines.push(`${prefix} ${v}`));
    });
  return lines;
});

const mergedVacationLines = computed(() => {
  const lines: string[] = [];
  analysisResults.value
    .filter((item) => item.ok)
    .forEach((item) => {
      const prefix = normalizeDeptPrefix(item.dept);
      (item.vacation ?? []).forEach((v) => lines.push(`${prefix} ${v}`));
    });
  return lines;
});

const mergedSpecialLines = computed(() => {
  const lines: string[] = [];
  analysisResults.value
    .filter((item) => item.ok)
    .forEach((item) => {
      const prefix = normalizeDeptPrefix(item.dept);
      (item.special ?? []).forEach((v) => lines.push(`${prefix} ${v}`));
    });
  return lines;
});

const analyzeTargetCount = computed(() => {
  if (testAnalyzeOneOnly.value) return Math.min(1, teamLeadRows.value.length);
  return teamLeadRows.value.length;
});
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickGoSignIn = async () => {
  await router.push('/sign-in');
};

const onClickGoSignUp = async () => {
  await router.push('/sign-up');
};

const onClickSignOut = () => {
  signOut();
};

const onClickCallStaffAuthProbe = async () => {
  const response = await fetchStaffAuthProbe({
    scDayStart: scDayStart.value,
    scDayEnd: scDayEnd.value,
  });

  lastDiaryAccessible.value = response.isDiaryAccessible;
  analysisResults.value = [];
  analysisNoticeMessage.value = '';
  analysisErrorMessage.value = '';
  testAnalyzeOneOnly.value = false;
  // URL은 화면에 표시하지 않지만, 다음 단계에서 쓸 수 있도록 상태로 들고 있는다.
  teamLeadRows.value = (response.teamLeadRows ?? []).map((row) => ({
    dept: row.dept,
    position: row.position,
    staffName: row.staffName,
    printUrl: row.printUrl,
  }));
};

const onClickAnalyzeDiary = async () => {
  analysisNoticeMessage.value = '';
  analysisErrorMessage.value = '';
  isAnalyzing.value = true;

  try {
    const targets = testAnalyzeOneOnly.value ? teamLeadRows.value.slice(0, 1) : teamLeadRows.value;
    const response = await fetchStaffDiaryAnalyze({
      targets: targets.map((row) => ({
        dept: row.dept,
        position: row.position,
        staffName: row.staffName,
        printUrl: row.printUrl,
      })),
    });

    analysisResults.value = (response.results ?? [])
      .filter((item) => !!item)
      .map((item) => ({
        dept: item.dept,
        position: item.position,
        staffName: item.staffName,
        ok: item.ok !== false,
        error: item.error,
        promotion: item.promotion ?? [],
        vacation: item.vacation ?? [],
        special: item.special ?? [],
        printUrl: item.printUrl,
      }));
    analysisNoticeMessage.value = String(response.alertMessage ?? '').trim();
  } catch (error) {
    analysisErrorMessage.value = (error as { message?: string })?.message
      ? String((error as { message?: string }).message)
      : `${error}`;
  } finally {
    isAnalyzing.value = false;
  }
};

const onChangeTestAnalyzeOneOnly = (event: Event) => {
  testAnalyzeOneOnly.value = readShoelaceChecked(event);
};
/* ======================= 메서드 ======================= */

function buildTodayText() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
</script>
