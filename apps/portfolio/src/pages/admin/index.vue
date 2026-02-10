<template>
  <main class="min-h-screen bg-slate-100 px-4 py-4 pb-6">
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <sl-card class="w-full">
        <div class="flex flex-col gap-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 flex-col gap-1">
              <div class="flex items-center gap-2">
                <h1 class="text-lg font-semibold">관리자 자산 운영</h1>
                <sl-badge variant="primary">Admin</sl-badge>
              </div>
              <div class="text-sm text-slate-600">
                매칭 실패 리포트를 확인하고, 관리자 자산 테이블에 즉시 반영할 수 있습니다.
              </div>
            </div>
            <div class="flex items-center gap-2">
              <sl-button variant="default" size="small" @click="onClickBack">돌아가기</sl-button>
              <sl-button v-if="isAuth" variant="default" size="small" @click="onClickSignout">로그아웃</sl-button>
            </div>
          </div>
          <sl-alert v-if="!isSuperuser" variant="warning" open>관리자 권한이 필요합니다.</sl-alert>
          <sl-alert v-else variant="success" open>PocketBase 슈퍼유저 권한이 확인되었습니다.</sl-alert>
        </div>
      </sl-card>

      <section class="grid grid-cols-3 gap-2">
        <article class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div class="text-xs text-slate-500">미매칭</div>
          <div class="mt-1 text-base font-semibold">{{ matchFailureCount }}</div>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div class="text-xs text-slate-500">관리 자산</div>
          <div class="mt-1 text-base font-semibold">{{ adminAssetCount }}</div>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div class="text-xs text-slate-500">동기화</div>
          <div class="mt-1 text-base font-semibold">
            {{ isMatchFailureFetching || isAdminAssetFetching ? '갱신중' : '최신' }}
          </div>
        </article>
      </section>

      <sl-tab-group :active-tab="activeTabName" @sl-tab-show="onShowAdminTab">
        <sl-tab slot="nav" panel="matching">매칭 등록</sl-tab>
        <sl-tab slot="nav" panel="assets">자산 관리</sl-tab>

        <sl-tab-panel name="matching">
          <div class="flex flex-col gap-3">
            <sl-card class="w-full">
              <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between gap-2">
                  <h2 class="text-base font-semibold">매칭 실패 리포트</h2>
                  <sl-button
                    variant="default"
                    size="small"
                    :loading="isMatchFailureFetching"
                    :disabled="!isSuperuser"
                    @click="onClickRefreshMatchFailureList"
                  >
                    새로고침
                  </sl-button>
                </div>

                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <sl-input v-model="matchSearchKeyword" clearable placeholder="자산명/리포트 ID 검색"></sl-input>
                  <sl-select
                    :value="matchCategoryFilter"
                    placeholder="카테고리 전체"
                    @sl-change="onChangeMatchCategoryFilter"
                  >
                    <sl-option value="">카테고리 전체</sl-option>
                    <sl-option v-for="option in categoryOptions" :key="`match-${option}`" :value="option">
                      {{ resolveLabel(option, categoryLabels) }}
                    </sl-option>
                  </sl-select>
                </div>

                <div class="flex flex-wrap items-end gap-2">
                  <sl-input v-model="matchFromDate" class="min-w-[140px] flex-1" type="date"></sl-input>
                  <sl-input v-model="matchToDate" class="min-w-[140px] flex-1" type="date"></sl-input>
                  <sl-switch
                    class="pb-2"
                    :checked="isMatchDuplicateNameRemoved"
                    @sl-change="onChangeMatchDuplicateNameRemoved"
                  >
                    종목명 중복 제거
                  </sl-switch>
                </div>

                <div class="text-xs text-slate-500">
                  총 {{ matchFailureCount }}건 중 {{ filteredMatchFailureList.length }}건 표시
                </div>
              </div>
            </sl-card>

            <sl-alert
              v-if="matchActionSuccessMessage"
              variant="success"
              open
              closable
              @sl-after-hide="onHideMatchSuccessAlert"
            >
              {{ matchActionSuccessMessage }}
            </sl-alert>
            <sl-alert v-if="!isMatchActionDialogOpen && matchActionErrorMessage" variant="danger" open>
              {{ matchActionErrorMessage }}
            </sl-alert>
            <sl-alert v-if="!isSuperuser" variant="warning" open>관리자 권한으로 로그인 후 사용하세요.</sl-alert>

            <template v-else>
              <sl-card v-if="isMatchFailureLoading" class="w-full">
                <div class="text-sm text-slate-600">매칭 실패 목록을 불러오는 중입니다.</div>
              </sl-card>
              <sl-card v-else-if="!filteredMatchFailureList.length" class="w-full">
                <div class="text-sm text-slate-600">조건에 맞는 매칭 실패 항목이 없습니다.</div>
              </sl-card>
              <div v-else class="flex flex-col gap-3">
                <sl-card v-for="item in filteredMatchFailureList" :key="item.id" class="w-full">
                  <div class="flex flex-col gap-3">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <div class="truncate text-base font-semibold">{{ item.rawName }}</div>
                        <div class="mt-1 text-xs text-slate-500">리포트 ID {{ item.reportId }}</div>
                      </div>
                      <sl-badge variant="warning">미매칭</sl-badge>
                    </div>

                    <div class="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div class="flex flex-col gap-1">
                        <div class="text-xs text-slate-500">카테고리</div>
                        <div class="text-sm font-semibold">{{ resolveLabel(item.category, categoryLabels) }}</div>
                      </div>
                      <div class="flex flex-col gap-1">
                        <div class="text-xs text-slate-500">평가 금액</div>
                        <div class="text-sm font-semibold">{{ formatNumber(item.amount) }}</div>
                      </div>
                      <div class="flex flex-col gap-1">
                        <div class="text-xs text-slate-500">손익</div>
                        <div class="text-sm font-semibold">{{ formatNumber(item.profit) }}</div>
                      </div>
                      <div class="flex flex-col gap-1">
                        <div class="text-xs text-slate-500">손익률</div>
                        <div class="text-sm font-semibold">{{ formatRate(item.profitRate) }}</div>
                      </div>
                    </div>

                    <sl-button
                      variant="primary"
                      size="small"
                      :disabled="isMatchActionProcessing"
                      @click="onClickOpenMatchActionDialog(item)"
                    >
                      매칭 처리
                    </sl-button>
                  </div>
                </sl-card>
              </div>
            </template>
          </div>
        </sl-tab-panel>

        <sl-tab-panel name="assets">
          <div class="flex flex-col gap-3">
            <sl-card class="w-full">
              <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between gap-2">
                  <h2 class="text-base font-semibold">관리자 자산 테이블</h2>
                  <div class="flex items-center gap-2">
                    <sl-button
                      variant="default"
                      size="small"
                      :loading="isAdminAssetFetching"
                      :disabled="!isSuperuser"
                      @click="onClickRefreshAdminAssetList"
                    >
                      새로고침
                    </sl-button>
                    <sl-button
                      variant="primary"
                      size="small"
                      :disabled="!isSuperuser"
                      @click="onClickOpenCreateAdminAssetDialog"
                    >
                      신규 추가
                    </sl-button>
                  </div>
                </div>

                <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <sl-input v-model="adminAssetSearchKeyword" clearable placeholder="자산명/별칭 검색"></sl-input>
                  <sl-select
                    :value="adminAssetCategoryFilter"
                    placeholder="카테고리 전체"
                    @sl-change="onChangeAdminAssetCategoryFilter"
                  >
                    <sl-option value="">카테고리 전체</sl-option>
                    <sl-option v-for="option in categoryOptions" :key="`admin-category-${option}`" :value="option">
                      {{ resolveLabel(option, categoryLabels) }}
                    </sl-option>
                  </sl-select>
                  <sl-select
                    :value="adminAssetGroupTypeFilter"
                    placeholder="그룹 전체"
                    @sl-change="onChangeAdminAssetGroupTypeFilter"
                  >
                    <sl-option value="">그룹 전체</sl-option>
                    <sl-option v-for="option in groupTypeOptions" :key="`admin-group-${option}`" :value="option">
                      {{ resolveLabel(option, groupTypeLabels) }}
                    </sl-option>
                  </sl-select>
                </div>

                <div class="text-xs text-slate-500">
                  총 {{ adminAssetCount }}건 중 {{ filteredAdminAssetList.length }}건 표시
                </div>
              </div>
            </sl-card>

            <sl-alert
              v-if="adminAssetActionSuccessMessage"
              variant="success"
              open
              closable
              @sl-after-hide="onHideAdminAssetSuccessAlert"
            >
              {{ adminAssetActionSuccessMessage }}
            </sl-alert>
            <sl-alert v-if="adminAssetActionErrorMessage" variant="danger" open>
              {{ adminAssetActionErrorMessage }}
            </sl-alert>
            <sl-alert v-if="!isSuperuser" variant="warning" open>관리자 권한으로 로그인 후 사용하세요.</sl-alert>

            <template v-else>
              <sl-card v-if="isAdminAssetLoading" class="w-full">
                <div class="text-sm text-slate-600">관리자 자산 목록을 불러오는 중입니다.</div>
              </sl-card>
              <sl-card v-else-if="!filteredAdminAssetList.length" class="w-full">
                <div class="text-sm text-slate-600">조건에 맞는 관리자 자산이 없습니다.</div>
              </sl-card>
              <div v-else class="flex flex-col gap-3">
                <sl-card v-for="asset in filteredAdminAssetList" :key="asset.id" class="w-full">
                  <div class="flex flex-col gap-3">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <div class="truncate text-base font-semibold">{{ asset.name }}</div>
                        <div class="mt-1 text-xs text-slate-500">ID {{ asset.id }}</div>
                      </div>
                      <div class="flex items-center gap-2">
                        <sl-button
                          variant="default"
                          size="small"
                          :disabled="isAdminAssetMutationProcessing"
                          @click="onClickOpenEditAdminAssetDialog(asset)"
                        >
                          수정
                        </sl-button>
                        <sl-button
                          variant="danger"
                          size="small"
                          :disabled="isAdminAssetMutationProcessing"
                          @click="onClickDeleteAdminAsset(asset)"
                        >
                          삭제
                        </sl-button>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div class="flex flex-col gap-1">
                        <div class="text-xs text-slate-500">카테고리</div>
                        <div class="text-sm font-semibold">{{ resolveLabel(asset.category, categoryLabels) }}</div>
                      </div>
                      <div class="flex flex-col gap-1">
                        <div class="text-xs text-slate-500">그룹</div>
                        <div class="text-sm font-semibold">{{ resolveLabel(asset.groupType, groupTypeLabels) }}</div>
                      </div>
                    </div>

                    <div class="flex flex-col gap-2">
                      <div class="text-xs text-slate-500">
                        별칭: {{ formatAliasList(asset.alias1, asset.alias2, asset.alias3) }}
                      </div>
                      <div class="text-xs text-slate-500">
                        태그: {{ formatLabelList(resolveLabelList(asset.tags, tagLabels)) }}
                      </div>
                      <div class="text-xs text-slate-500">
                        섹터: {{ formatLabelList(resolveLabelList(asset.sectors, sectorLabels)) }}
                      </div>
                    </div>
                  </div>
                </sl-card>
              </div>
            </template>
          </div>
        </sl-tab-panel>
      </sl-tab-group>
    </div>

    <sl-dialog
      label="매칭 처리"
      :open="isMatchActionDialogOpen"
      @sl-request-close="onRequestCloseMatchActionDialog"
      @sl-after-hide="onAfterHideMatchActionDialog"
    >
      <div v-if="selectedMatchFailure" class="flex flex-col gap-3">
        <sl-alert v-if="matchActionDialogErrorMessage" variant="danger" open>
          {{ matchActionDialogErrorMessage }}
        </sl-alert>

        <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div class="text-xs text-slate-500">원본 자산명</div>
          <div class="mt-1 text-sm font-semibold">{{ selectedMatchFailure.rawName }}</div>
          <div class="mt-2 text-xs text-slate-500">
            카테고리 {{ resolveLabel(selectedMatchFailure.category, categoryLabels) }} / 금액
            {{ formatNumber(selectedMatchFailure.amount) }}
          </div>
        </div>

        <sl-radio-group :value="matchActionMode" label="처리 방식" @sl-change="onChangeMatchActionMode">
          <sl-radio value="create">신규 등록 후 매칭</sl-radio>
          <sl-radio value="link">기존 자산에 매칭</sl-radio>
        </sl-radio-group>

        <template v-if="matchActionMode === 'create'">
          <sl-input v-model="matchCreateForm.name" label="자산명" placeholder="예: 삼성전자 보통주"></sl-input>
          <div class="flex items-center justify-between gap-2">
            <div class="text-xs text-slate-500">AI 추천으로 분류값 자동 입력</div>
            <sl-button
              variant="default"
              size="small"
              :loading="isMatchFailureAiSuggesting"
              :disabled="isMatchFailureAiSuggesting || isMatchActionProcessing"
              @click="onClickSuggestMatchCreateFormByAi"
            >
              AI 추천
            </sl-button>
          </div>
          <div v-if="matchAiSuggestionMessage" class="text-xs text-emerald-700">
            {{ matchAiSuggestionMessage }}
          </div>

          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <sl-select :value="matchCreateForm.category" label="카테고리" @sl-change="onChangeMatchCreateCategory">
              <sl-option v-for="option in categoryOptions" :key="`match-create-category-${option}`" :value="option">
                {{ resolveLabel(option, categoryLabels) }}
              </sl-option>
            </sl-select>

            <sl-select :value="matchCreateForm.groupType" label="그룹 타입" @sl-change="onChangeMatchCreateGroupType">
              <sl-option v-for="option in groupTypeOptions" :key="`match-create-group-${option}`" :value="option">
                {{ resolveLabel(option, groupTypeLabels) }}
              </sl-option>
            </sl-select>
          </div>

          <sl-details summary="추가 정보 (선택)">
            <div class="mt-3 flex flex-col gap-2">
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <sl-input v-model="matchCreateForm.alias1" label="별칭 1"></sl-input>
                <sl-input v-model="matchCreateForm.alias2" label="별칭 2"></sl-input>
                <sl-input v-model="matchCreateForm.alias3" label="별칭 3"></sl-input>
              </div>

              <sl-select
                :value="matchCreateForm.tags"
                label="태그 (복수 선택)"
                multiple
                :max-options-visible="6"
                @sl-change="onChangeMatchCreateTags"
              >
                <sl-option v-for="option in tagOptions" :key="`match-create-tag-${option}`" :value="option">
                  {{ resolveLabel(option, tagLabels) }}
                </sl-option>
              </sl-select>
              <div class="text-xs text-slate-500">최대 3개 선택</div>

              <sl-select
                :value="matchCreateForm.sectors"
                label="섹터 (복수 선택)"
                multiple
                :max-options-visible="8"
                @sl-change="onChangeMatchCreateSectors"
              >
                <sl-option v-for="option in sectorOptions" :key="`match-create-sector-${option}`" :value="option">
                  {{ resolveLabel(option, sectorLabels) }}
                </sl-option>
              </sl-select>
              <div class="text-xs text-slate-500">최대 2개 선택</div>
            </div>
          </sl-details>
        </template>

        <template v-else>
          <sl-input
            v-model="matchLinkSearchKeyword"
            clearable
            label="기존 자산 검색"
            placeholder="자산명/별칭 검색"
          ></sl-input>

          <sl-select
            :value="selectedAdminAssetIdForLink"
            label="연결할 관리자 자산"
            placeholder="자산을 선택하세요"
            @sl-change="onChangeSelectedAdminAssetForLink"
          >
            <sl-option
              v-for="asset in filteredLinkableAdminAssetList"
              :key="`match-link-${asset.id}`"
              :value="asset.id"
            >
              {{ asset.name }} · {{ resolveLabel(asset.category, categoryLabels) }}
            </sl-option>
          </sl-select>

          <div class="text-xs text-slate-500">검색 결과 {{ filteredLinkableAdminAssetList.length }}건</div>
        </template>
      </div>

      <div slot="footer" class="flex items-center justify-end gap-2">
        <sl-button
          variant="default"
          :disabled="isMatchActionProcessing || isMatchFailureAiSuggesting"
          @click="onClickCloseMatchActionDialog"
        >
          닫기
        </sl-button>
        <sl-button
          variant="primary"
          :loading="isMatchActionProcessing"
          :disabled="isMatchActionButtonDisabled"
          @click="onClickSubmitMatchAction"
        >
          {{ matchActionMode === 'create' ? '신규 등록 후 매칭' : '기존 자산으로 매칭' }}
        </sl-button>
      </div>
    </sl-dialog>

    <sl-dialog
      :label="adminAssetDialogTitle"
      :open="isAdminAssetDialogOpen"
      @sl-request-close="onRequestCloseAdminAssetDialog"
      @sl-after-hide="onAfterHideAdminAssetDialog"
    >
      <div class="flex flex-col gap-3">
        <sl-input v-model="adminAssetForm.name" label="자산명" placeholder="예: KODEX 200"></sl-input>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <sl-select :value="adminAssetForm.category" label="카테고리" @sl-change="onChangeAdminAssetFormCategory">
            <sl-option v-for="option in categoryOptions" :key="`admin-form-category-${option}`" :value="option">
              {{ resolveLabel(option, categoryLabels) }}
            </sl-option>
          </sl-select>

          <sl-select :value="adminAssetForm.groupType" label="그룹 타입" @sl-change="onChangeAdminAssetFormGroupType">
            <sl-option v-for="option in groupTypeOptions" :key="`admin-form-group-${option}`" :value="option">
              {{ resolveLabel(option, groupTypeLabels) }}
            </sl-option>
          </sl-select>
        </div>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <sl-input v-model="adminAssetForm.alias1" label="별칭 1"></sl-input>
          <sl-input v-model="adminAssetForm.alias2" label="별칭 2"></sl-input>
          <sl-input v-model="adminAssetForm.alias3" label="별칭 3"></sl-input>
        </div>

        <sl-select
          :value="adminAssetForm.tags"
          label="태그 (복수 선택)"
          multiple
          :max-options-visible="6"
          @sl-change="onChangeAdminAssetFormTags"
        >
          <sl-option v-for="option in tagOptions" :key="`admin-form-tag-${option}`" :value="option">
            {{ resolveLabel(option, tagLabels) }}
          </sl-option>
        </sl-select>
        <div class="text-xs text-slate-500">최대 3개 선택</div>

        <sl-select
          :value="adminAssetForm.sectors"
          label="섹터 (복수 선택)"
          multiple
          :max-options-visible="8"
          @sl-change="onChangeAdminAssetFormSectors"
        >
          <sl-option v-for="option in sectorOptions" :key="`admin-form-sector-${option}`" :value="option">
            {{ resolveLabel(option, sectorLabels) }}
          </sl-option>
        </sl-select>
        <div class="text-xs text-slate-500">최대 2개 선택</div>
      </div>

      <div slot="footer" class="flex items-center justify-end gap-2">
        <sl-button variant="default" :disabled="isAdminAssetMutationProcessing" @click="onClickCloseAdminAssetDialog"
          >닫기</sl-button
        >
        <sl-button
          variant="primary"
          :loading="isAdminAssetMutationProcessing"
          :disabled="isAdminAssetSaveButtonDisabled"
          @click="onClickSubmitAdminAssetDialog"
        >
          {{ adminAssetDialogMode === 'create' ? '신규 저장' : '수정 저장' }}
        </sl-button>
      </div>
    </sl-dialog>
  </main>
</template>

<script setup lang="ts">
import {
  AdminAssetsCategoryOptions,
  AdminAssetsGroupTypeOptions,
  AdminAssetsSectorsOptions,
  AdminAssetsTagsOptions,
  Collections,
  ExtractedAssetsCategoryOptions,
  type AdminAssetsResponse,
  type Create,
  type ExtractedAssetsResponse,
  type Update,
} from '@/api/pocketbase-types';
import { useAdminAssets } from '@/composables/useAdminAssets';
import { useAuth } from '@/composables/useAuth';
import { useMatchFailures } from '@/composables/useMatchFailures';
import {
  categoryLabels,
  groupTypeLabels,
  resolveLabel,
  resolveLabelList,
  sectorLabels,
  tagLabels,
} from '@/ui/asset-labels';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

type MatchActionMode = 'create' | 'link';
type AdminAssetDialogMode = 'create' | 'edit';

type AdminAssetForm = {
  name: string;
  category: AdminAssetsCategoryOptions;
  groupType: AdminAssetsGroupTypeOptions;
  alias1: string;
  alias2: string;
  alias3: string;
  tags: AdminAssetsTagsOptions[];
  sectors: AdminAssetsSectorsOptions[];
};

type SelectTarget = EventTarget & {
  value?: string | string[];
};
type SwitchTarget = EventTarget & {
  checked?: boolean;
};

function buildEmptyAdminAssetForm(): AdminAssetForm {
  return {
    name: '',
    category: AdminAssetsCategoryOptions.stock,
    groupType: AdminAssetsGroupTypeOptions.risk,
    alias1: '',
    alias2: '',
    alias3: '',
    tags: [],
    sectors: [],
  };
}

function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildRecentWeekDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  return {
    from: formatDateInputValue(from),
    to: formatDateInputValue(to),
  };
}

/* ======================= 변수 ======================= */
const router = useRouter();
const { isAuth, isSuperuser, deleteAuthSession, fetchAuthState } = useAuth();
const matchFailureEnabled = computed(() => isSuperuser.value);
const initialMatchDateRange = buildRecentWeekDateRange();
const matchFromDate = ref(initialMatchDateRange.from);
const matchToDate = ref(initialMatchDateRange.to);
const {
  matchFailureList,
  matchFailureCount,
  isMatchFailureLoading,
  isMatchFailureFetching,
  isMatchFailureAiSuggesting,
  matchFailureAiSuggestionError,
  fetchMatchFailureList,
  fetchMatchFailureAiSuggestion,
} = useMatchFailures(matchFailureEnabled, { fromDate: matchFromDate, toDate: matchToDate });
const {
  adminAssetList,
  adminAssetCount,
  isAdminAssetLoading,
  isAdminAssetFetching,
  isAdminAssetCreating,
  isAdminAssetUpdating,
  isAdminAssetDeleting,
  isExtractedAssetConnecting,
  createAdminAssetError,
  updateAdminAssetError,
  deleteAdminAssetError,
  connectExtractedAssetError,
  fetchAdminAssetList,
  createAdminAsset,
  updateAdminAsset,
  deleteAdminAsset,
  connectExtractedAssetToAdminAsset,
  createAdminAssetFromExtractedAsset,
} = useAdminAssets(matchFailureEnabled);

const activeTabName = ref('matching');
const TAG_MAX_SELECT = 3;
const SECTOR_MAX_SELECT = 2;
const categoryOptions = Object.values(AdminAssetsCategoryOptions) as AdminAssetsCategoryOptions[];
const groupTypeOptions = Object.values(AdminAssetsGroupTypeOptions) as AdminAssetsGroupTypeOptions[];
const tagOptions = Object.values(AdminAssetsTagsOptions) as AdminAssetsTagsOptions[];
const sectorOptions = Object.values(AdminAssetsSectorsOptions) as AdminAssetsSectorsOptions[];

const matchSearchKeyword = ref('');
const matchCategoryFilter = ref<ExtractedAssetsCategoryOptions | ''>('');
const isMatchDuplicateNameRemoved = ref(true);

const adminAssetSearchKeyword = ref('');
const adminAssetCategoryFilter = ref<AdminAssetsCategoryOptions | ''>('');
const adminAssetGroupTypeFilter = ref<AdminAssetsGroupTypeOptions | ''>('');

const selectedMatchFailure = ref<ExtractedAssetsResponse | null>(null);
const isMatchActionDialogOpen = ref(false);
const matchActionMode = ref<MatchActionMode>('create');
const matchLinkSearchKeyword = ref('');
const selectedAdminAssetIdForLink = ref('');
const matchCreateForm = ref<AdminAssetForm>(buildEmptyAdminAssetForm());

const adminAssetDialogMode = ref<AdminAssetDialogMode>('create');
const selectedAdminAssetIdForEdit = ref('');
const isAdminAssetDialogOpen = ref(false);
const adminAssetForm = ref<AdminAssetForm>(buildEmptyAdminAssetForm());

const matchActionSuccessMessage = ref('');
const matchAiSuggestionMessage = ref('');
const adminAssetActionSuccessMessage = ref('');

const filteredMatchFailureList = computed(() => {
  const keyword = matchSearchKeyword.value.trim().toLowerCase();
  const filteredByConditions = matchFailureList.value.filter((item) => {
    const byKeyword =
      !keyword || item.rawName.toLowerCase().includes(keyword) || item.reportId.toLowerCase().includes(keyword);
    const byCategory = !matchCategoryFilter.value || item.category === matchCategoryFilter.value;
    return byKeyword && byCategory;
  });

  if (!isMatchDuplicateNameRemoved.value) {
    return filteredByConditions;
  }

  const seen = new Set<string>();
  return filteredByConditions.filter((item) => {
    const normalizedName = item.rawName.trim().toLowerCase();
    if (seen.has(normalizedName)) {
      return false;
    }
    seen.add(normalizedName);
    return true;
  });
});

const filteredAdminAssetList = computed(() => {
  const keyword = adminAssetSearchKeyword.value.trim().toLowerCase();
  return adminAssetList.value.filter((item) => {
    const aliases = [item.alias1, item.alias2, item.alias3].filter(Boolean).join(' ').toLowerCase();
    const byKeyword = !keyword || item.name.toLowerCase().includes(keyword) || aliases.includes(keyword);
    const byCategory = !adminAssetCategoryFilter.value || item.category === adminAssetCategoryFilter.value;
    const byGroupType = !adminAssetGroupTypeFilter.value || item.groupType === adminAssetGroupTypeFilter.value;
    return byKeyword && byCategory && byGroupType;
  });
});

const filteredLinkableAdminAssetList = computed(() => {
  const keyword = matchLinkSearchKeyword.value.trim().toLowerCase();
  return adminAssetList.value
    .filter((item) => {
      const aliases = [item.alias1, item.alias2, item.alias3].filter(Boolean).join(' ').toLowerCase();
      if (!keyword) {
        return true;
      }
      return item.name.toLowerCase().includes(keyword) || aliases.includes(keyword);
    })
    .slice(0, 80);
});

const isMatchActionProcessing = computed(() => isAdminAssetCreating.value || isExtractedAssetConnecting.value);
const isAdminAssetMutationProcessing = computed(
  () => isAdminAssetCreating.value || isAdminAssetUpdating.value || isAdminAssetDeleting.value,
);

const matchActionErrorMessage = computed(() => {
  if (matchFailureAiSuggestionError.value) {
    return formatErrorMessage(matchFailureAiSuggestionError.value);
  }
  if (connectExtractedAssetError.value) {
    return formatErrorMessage(connectExtractedAssetError.value);
  }
  if (createAdminAssetError.value) {
    return formatErrorMessage(createAdminAssetError.value);
  }
  return '';
});
const matchActionDialogErrorMessage = computed(() => {
  if (!isMatchActionDialogOpen.value) {
    return '';
  }
  return matchActionErrorMessage.value;
});

const adminAssetActionErrorMessage = computed(() => {
  if (deleteAdminAssetError.value) {
    return formatErrorMessage(deleteAdminAssetError.value);
  }
  if (updateAdminAssetError.value) {
    return formatErrorMessage(updateAdminAssetError.value);
  }
  if (createAdminAssetError.value) {
    return formatErrorMessage(createAdminAssetError.value);
  }
  return '';
});

const adminAssetDialogTitle = computed(() => {
  return adminAssetDialogMode.value === 'create' ? '관리자 자산 신규 추가' : '관리자 자산 수정';
});

const isMatchActionButtonDisabled = computed(() => {
  if (
    !selectedMatchFailure.value ||
    !isSuperuser.value ||
    isMatchActionProcessing.value ||
    isMatchFailureAiSuggesting.value
  ) {
    return true;
  }

  if (matchActionMode.value === 'create') {
    return !matchCreateForm.value.name.trim();
  }

  return !selectedAdminAssetIdForLink.value;
});

const isAdminAssetSaveButtonDisabled = computed(() => {
  if (!isSuperuser.value || isAdminAssetMutationProcessing.value) {
    return true;
  }

  if (!adminAssetForm.value.name.trim()) {
    return true;
  }

  if (adminAssetDialogMode.value === 'edit' && !selectedAdminAssetIdForEdit.value) {
    return true;
  }

  return false;
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
const onClickBack = () => {
  router.push('/');
};

const onClickSignout = () => {
  deleteAuthSession();
  router.push('/');
};

const onShowAdminTab = (event: Event) => {
  const detail = (event as CustomEvent<{ name: string }>).detail;
  activeTabName.value = detail.name;
};

const onClickRefreshMatchFailureList = () => {
  fetchMatchFailureList();
};

const onClickRefreshAdminAssetList = () => {
  fetchAdminAssetList();
};

const onChangeMatchCategoryFilter = (event: Event) => {
  matchCategoryFilter.value = readSingleSelectValue(event) as ExtractedAssetsCategoryOptions | '';
};

const onChangeAdminAssetCategoryFilter = (event: Event) => {
  adminAssetCategoryFilter.value = readSingleSelectValue(event) as AdminAssetsCategoryOptions | '';
};

const onChangeAdminAssetGroupTypeFilter = (event: Event) => {
  adminAssetGroupTypeFilter.value = readSingleSelectValue(event) as AdminAssetsGroupTypeOptions | '';
};

const onChangeMatchDuplicateNameRemoved = (event: Event) => {
  const target = event.target as SwitchTarget | null;
  isMatchDuplicateNameRemoved.value = Boolean(target?.checked);
};

const onClickOpenMatchActionDialog = (item: ExtractedAssetsResponse) => {
  selectedMatchFailure.value = item;
  matchActionMode.value = 'create';
  matchLinkSearchKeyword.value = item.rawName;
  selectedAdminAssetIdForLink.value = '';
  matchCreateForm.value = buildAdminAssetFormFromMatchFailure(item);
  matchAiSuggestionMessage.value = '';
  isMatchActionDialogOpen.value = true;
};

const onClickCloseMatchActionDialog = () => {
  isMatchActionDialogOpen.value = false;
};

const onRequestCloseMatchActionDialog = (event: Event) => {
  if (isMatchActionProcessing.value || isMatchFailureAiSuggesting.value) {
    event.preventDefault();
    return;
  }
  isMatchActionDialogOpen.value = false;
};

const onAfterHideMatchActionDialog = (event: Event) => {
  if (event.target !== event.currentTarget) {
    return;
  }
  resetMatchActionDialogState();
};

const onChangeMatchActionMode = (event: Event) => {
  const value = readSingleSelectValue(event);
  if (value === 'create' || value === 'link') {
    matchActionMode.value = value;
  }
};

const onChangeMatchCreateCategory = (event: Event) => {
  const category = readSingleSelectValue(event) as AdminAssetsCategoryOptions;
  matchCreateForm.value.category = category;
  matchCreateForm.value.groupType = resolveDefaultGroupType(category);
};

const onChangeMatchCreateGroupType = (event: Event) => {
  matchCreateForm.value.groupType = readSingleSelectValue(event) as AdminAssetsGroupTypeOptions;
};

const onChangeMatchCreateTags = (event: Event) => {
  matchCreateForm.value.tags = limitMultiSelectValues(
    readMultiSelectValue(event) as AdminAssetsTagsOptions[],
    TAG_MAX_SELECT,
  );
};

const onChangeMatchCreateSectors = (event: Event) => {
  matchCreateForm.value.sectors = limitMultiSelectValues(
    readMultiSelectValue(event) as AdminAssetsSectorsOptions[],
    SECTOR_MAX_SELECT,
  );
};

const onClickSuggestMatchCreateFormByAi = () => {
  if (
    !selectedMatchFailure.value ||
    !isSuperuser.value ||
    isMatchFailureAiSuggesting.value ||
    isMatchActionProcessing.value
  ) {
    return;
  }

  const selectedItem = selectedMatchFailure.value;
  const selectedItemId = selectedItem.id;
  matchAiSuggestionMessage.value = '';

  fetchMatchFailureAiSuggestion(
    {
      rawName: selectedItem.rawName,
      category: selectedItem.category,
    },
    (suggestion) => {
      if (selectedMatchFailure.value?.id !== selectedItemId) {
        return;
      }
      matchCreateForm.value.category = suggestion.category;
      matchCreateForm.value.groupType = suggestion.groupType;
      matchCreateForm.value.tags = limitMultiSelectValues(suggestion.tags, TAG_MAX_SELECT);
      matchCreateForm.value.sectors = limitMultiSelectValues(suggestion.sectors, SECTOR_MAX_SELECT);
      matchAiSuggestionMessage.value = 'AI 추천값을 반영했습니다. 최종 확인 후 등록하세요.';
    },
  );
};

const onChangeSelectedAdminAssetForLink = (event: Event) => {
  selectedAdminAssetIdForLink.value = readSingleSelectValue(event);
};

const onClickSubmitMatchAction = () => {
  if (!selectedMatchFailure.value || !isSuperuser.value) {
    return;
  }

  const selectedItem = selectedMatchFailure.value;

  if (matchActionMode.value === 'create') {
    createAdminAssetFromExtractedAsset(
      {
        extractedAssetId: selectedItem.id,
        data: buildCreateAdminAssetData(matchCreateForm.value),
      },
      (asset) => {
        matchActionSuccessMessage.value = `${selectedItem.rawName} 항목이 ${asset.name} 자산으로 등록 및 매칭되었습니다.`;
        isMatchActionDialogOpen.value = false;
      },
    );
    return;
  }

  if (!selectedAdminAssetIdForLink.value) {
    return;
  }

  const selectedAsset = adminAssetList.value.find((item) => item.id === selectedAdminAssetIdForLink.value);
  connectExtractedAssetToAdminAsset(
    {
      extractedAssetId: selectedItem.id,
      adminAssetId: selectedAdminAssetIdForLink.value,
    },
    () => {
      matchActionSuccessMessage.value = `${selectedItem.rawName} 항목이 ${selectedAsset?.name ?? '선택 자산'} 자산으로 매칭되었습니다.`;
      isMatchActionDialogOpen.value = false;
    },
  );
};

const onClickOpenCreateAdminAssetDialog = () => {
  adminAssetDialogMode.value = 'create';
  selectedAdminAssetIdForEdit.value = '';
  adminAssetForm.value = buildEmptyAdminAssetForm();
  isAdminAssetDialogOpen.value = true;
};

const onClickOpenEditAdminAssetDialog = (asset: AdminAssetsResponse) => {
  adminAssetDialogMode.value = 'edit';
  selectedAdminAssetIdForEdit.value = asset.id;
  adminAssetForm.value = {
    name: asset.name,
    category: asset.category,
    groupType: asset.groupType,
    alias1: asset.alias1 ?? '',
    alias2: asset.alias2 ?? '',
    alias3: asset.alias3 ?? '',
    tags: limitMultiSelectValues(asset.tags ?? [], TAG_MAX_SELECT),
    sectors: limitMultiSelectValues(asset.sectors ?? [], SECTOR_MAX_SELECT),
  };
  isAdminAssetDialogOpen.value = true;
};

const onClickDeleteAdminAsset = (asset: AdminAssetsResponse) => {
  if (!isSuperuser.value || isAdminAssetMutationProcessing.value) {
    return;
  }

  const isConfirmed = window.confirm(
    `${asset.name} 자산을 삭제하시겠습니까?\n연결된 매칭 데이터의 자산 연결은 해제됩니다.`,
  );
  if (!isConfirmed) {
    return;
  }

  deleteAdminAsset(
    {
      adminAssetId: asset.id,
    },
    () => {
      adminAssetActionSuccessMessage.value = `${asset.name} 자산이 삭제되었습니다.`;
    },
  );
};

const onClickCloseAdminAssetDialog = () => {
  isAdminAssetDialogOpen.value = false;
};

const onRequestCloseAdminAssetDialog = (event: Event) => {
  if (isAdminAssetMutationProcessing.value) {
    event.preventDefault();
    return;
  }
  isAdminAssetDialogOpen.value = false;
};

const onAfterHideAdminAssetDialog = (event: Event) => {
  if (event.target !== event.currentTarget) {
    return;
  }
  resetAdminAssetDialogState();
};

const onChangeAdminAssetFormCategory = (event: Event) => {
  const category = readSingleSelectValue(event) as AdminAssetsCategoryOptions;
  adminAssetForm.value.category = category;
  adminAssetForm.value.groupType = resolveDefaultGroupType(category);
};

const onChangeAdminAssetFormGroupType = (event: Event) => {
  adminAssetForm.value.groupType = readSingleSelectValue(event) as AdminAssetsGroupTypeOptions;
};

const onChangeAdminAssetFormTags = (event: Event) => {
  adminAssetForm.value.tags = limitMultiSelectValues(
    readMultiSelectValue(event) as AdminAssetsTagsOptions[],
    TAG_MAX_SELECT,
  );
};

const onChangeAdminAssetFormSectors = (event: Event) => {
  adminAssetForm.value.sectors = limitMultiSelectValues(
    readMultiSelectValue(event) as AdminAssetsSectorsOptions[],
    SECTOR_MAX_SELECT,
  );
};

const onClickSubmitAdminAssetDialog = () => {
  if (!isSuperuser.value) {
    return;
  }

  if (adminAssetDialogMode.value === 'create') {
    createAdminAsset(buildCreateAdminAssetData(adminAssetForm.value), (asset) => {
      adminAssetActionSuccessMessage.value = `${asset.name} 자산이 추가되었습니다.`;
      isAdminAssetDialogOpen.value = false;
    });
    return;
  }

  if (!selectedAdminAssetIdForEdit.value) {
    return;
  }

  updateAdminAsset(
    {
      adminAssetId: selectedAdminAssetIdForEdit.value,
      data: buildUpdateAdminAssetData(adminAssetForm.value),
    },
    (asset) => {
      adminAssetActionSuccessMessage.value = `${asset.name} 자산이 수정되었습니다.`;
      isAdminAssetDialogOpen.value = false;
    },
  );
};

const onHideMatchSuccessAlert = () => {
  matchActionSuccessMessage.value = '';
};

const onHideAdminAssetSuccessAlert = () => {
  adminAssetActionSuccessMessage.value = '';
};
/* ======================= 메서드 ======================= */

const buildAdminAssetFormFromMatchFailure = (item: ExtractedAssetsResponse): AdminAssetForm => {
  const category = item.category as unknown as AdminAssetsCategoryOptions;
  return {
    name: item.rawName,
    category,
    groupType: resolveDefaultGroupType(category),
    alias1: item.rawName,
    alias2: '',
    alias3: '',
    tags: [],
    sectors: [],
  };
};

const resolveDefaultGroupType = (category: AdminAssetsCategoryOptions): AdminAssetsGroupTypeOptions => {
  switch (category) {
    case AdminAssetsCategoryOptions.cash:
      return AdminAssetsGroupTypeOptions.liquid;
    case AdminAssetsCategoryOptions.deposit:
      return AdminAssetsGroupTypeOptions.defensive;
    case AdminAssetsCategoryOptions.stock:
    case AdminAssetsCategoryOptions.etf:
    case AdminAssetsCategoryOptions.fund:
    case AdminAssetsCategoryOptions.crypto:
      return AdminAssetsGroupTypeOptions.risk;
    case AdminAssetsCategoryOptions.bond:
    case AdminAssetsCategoryOptions.pension:
    case AdminAssetsCategoryOptions.insurance:
      return AdminAssetsGroupTypeOptions.defensive;
    case AdminAssetsCategoryOptions.real_estate:
    case AdminAssetsCategoryOptions.reits:
    case AdminAssetsCategoryOptions.commodity_gold:
    case AdminAssetsCategoryOptions.car:
    case AdminAssetsCategoryOptions.etc:
      return AdminAssetsGroupTypeOptions.real;
    default:
      return AdminAssetsGroupTypeOptions.risk;
  }
};

const buildCreateAdminAssetData = (form: AdminAssetForm): Create<Collections.AdminAssets> => {
  const data: Create<Collections.AdminAssets> = {
    name: form.name.trim(),
    category: form.category,
    groupType: form.groupType,
    tags: limitMultiSelectValues(form.tags, TAG_MAX_SELECT),
    sectors: limitMultiSelectValues(form.sectors, SECTOR_MAX_SELECT),
  };
  if (form.alias1.trim()) {
    data.alias1 = form.alias1.trim();
  }
  if (form.alias2.trim()) {
    data.alias2 = form.alias2.trim();
  }
  if (form.alias3.trim()) {
    data.alias3 = form.alias3.trim();
  }
  return data;
};

const buildUpdateAdminAssetData = (form: AdminAssetForm): Update<Collections.AdminAssets> => ({
  name: form.name.trim(),
  category: form.category,
  groupType: form.groupType,
  alias1: form.alias1.trim() || '',
  alias2: form.alias2.trim() || '',
  alias3: form.alias3.trim() || '',
  tags: limitMultiSelectValues(form.tags, TAG_MAX_SELECT),
  sectors: limitMultiSelectValues(form.sectors, SECTOR_MAX_SELECT),
});

const resetMatchActionDialogState = () => {
  selectedMatchFailure.value = null;
  matchActionMode.value = 'create';
  matchLinkSearchKeyword.value = '';
  selectedAdminAssetIdForLink.value = '';
  matchCreateForm.value = buildEmptyAdminAssetForm();
  matchAiSuggestionMessage.value = '';
};

const resetAdminAssetDialogState = () => {
  adminAssetDialogMode.value = 'create';
  selectedAdminAssetIdForEdit.value = '';
  adminAssetForm.value = buildEmptyAdminAssetForm();
};

const readSingleSelectValue = (event: Event) => {
  const target = event.target as SelectTarget | null;
  const value = target?.value ?? '';
  return Array.isArray(value) ? (value[0] ?? '') : value;
};

const readMultiSelectValue = (event: Event) => {
  const target = event.target as SelectTarget | null;
  const value = target?.value ?? [];
  if (Array.isArray(value)) {
    return value;
  }
  return value ? [value] : [];
};

const limitMultiSelectValues = <T extends string>(values: T[], maxSelect: number) => {
  if (values.length <= maxSelect) {
    return values;
  }
  return values.slice(0, maxSelect);
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

const formatAliasList = (alias1?: string, alias2?: string, alias3?: string) => {
  const list = [alias1, alias2, alias3].filter((item) => Boolean(item?.trim())) as string[];
  return list.length ? list.join(', ') : '-';
};

const formatLabelList = (values: string[]) => {
  return values.length ? values.join(', ') : '-';
};

const formatErrorMessage = (error: unknown) => {
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
};
</script>

