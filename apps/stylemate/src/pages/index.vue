<template>
  <main class="page-enter mx-auto flex min-h-screen w-full max-w-md flex-col gap-3 px-4 pb-10 pt-4">
    <header class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">내 옷장</h1>
      <sl-button size="small" @click="onClickSignoutButton">로그아웃</sl-button>
    </header>

    <sl-card class="overflow-hidden">
      <div class="flex items-center justify-between gap-2">
        <div class="text-base font-semibold">코디 추천</div>
        <div class="flex items-center gap-2">
          <sl-tag size="small" :variant="fetchCityWeatherTagVariant(anyangWeather)">{{ fetchCityWeatherLabel('안양', anyangWeather) }}</sl-tag>
          <sl-tag size="small" :variant="fetchCityWeatherTagVariant(seongnamWeather)">{{ fetchCityWeatherLabel('성남', seongnamWeather) }}</sl-tag>
          <sl-tag v-if="recommendationTemperatureSeason" size="small" :variant="recommendationTemperatureSeasonTagVariant">
            <span class="flex items-center gap-1">
              <sl-icon :name="recommendationTemperatureSeasonIconName"></sl-icon>
              <span>{{ recommendationTemperatureSeasonLabel }}</span>
            </span>
          </sl-tag>
          <sl-tag v-if="recommendationSessionId" size="small" variant="primary">라운드 {{ recommendationRound }}</sl-tag>
        </div>
      </div>

      <div class="mt-3 flex flex-col gap-3">
        <sl-input
          v-model="recommendationQueryText"
          label="원하는 스타일"
          placeholder="예: 오늘 출근룩, 베이지 톤으로 깔끔하게"
        ></sl-input>

        <sl-select label="후보 개수(topK)" :value="String(recommendationTopKInput)" @sl-change="onChangeRecommendationTopK">
          <sl-option value="6">6개</sl-option>
          <sl-option value="8">8개</sl-option>
          <sl-option value="12">12개</sl-option>
          <sl-option value="16">16개</sl-option>
        </sl-select>

        <div class="grid grid-cols-2 gap-2">
          <sl-button class="w-full" variant="primary" :loading="isCreatingRecommendationSession" @click="onClickRequestRecommendationButton">
            추천받기
          </sl-button>
          <sl-button
            class="w-full"
            :disabled="!recommendationSessionId || !recommendationItems.length"
            :loading="isUpdatingRecommendationReroll"
            @click="onClickRerollRecommendationButton"
          >
            고정 제외 재추천
          </sl-button>
        </div>
      </div>

      <div v-if="recommendationItems.length" class="mt-3 flex flex-col gap-2">
        <div v-for="item in recommendationItems" :key="item.itemId" class="rounded-xl p-3">
          <div class="flex gap-3">
            <img
              v-if="fetchRecommendationItemImageUrl(item)"
              class="h-20 w-20 rounded-xl object-contain"
              :src="fetchRecommendationItemImageUrl(item)"
              alt="추천 옷 이미지"
            />
            <div v-else class="flex h-20 w-20 items-center justify-center rounded-xl">
              <span class="text-xs">이미지 없음</span>
            </div>

            <div class="flex min-w-0 flex-1 flex-col gap-2">
              <div class="flex items-center justify-between gap-2">
                <div class="text-sm font-semibold">{{ fetchRecommendationCategoryLabel(item.category) }}</div>
                <span class="text-xs">유사도 {{ fetchRecommendationSimilarityLabel(item.similarity) }}</span>
              </div>

              <div class="text-sm">
                {{ fetchRecommendationSummaryLabel(item) }}
              </div>

              <div class="grid grid-cols-2 gap-2">
                <sl-switch size="small" :checked="item.isPinned" @sl-change="onChangeRecommendationPin(item.itemId, $event)">고정</sl-switch>
                <sl-button class="w-full" size="small" @click="onClickOpenRecommendationDetailButton(item)">상세 보기</sl-button>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <sl-input v-model="recommendationWornDate" label="착용일" type="date"></sl-input>
          <sl-input v-model="recommendationNote" label="메모" placeholder="선택 입력"></sl-input>
        </div>

        <sl-button class="w-full" variant="primary" :loading="isCreatingRecommendationConfirm" @click="onClickConfirmRecommendationButton">
          오늘 코디 확정
        </sl-button>
      </div>

      <div v-else class="mt-3 text-sm">
        원하는 코디를 입력하고 추천받기를 눌러주세요.
      </div>
    </sl-card>

    <div class="flex items-center justify-between px-1">
      <div class="flex items-center gap-2">
        <div class="text-sm font-semibold">목록</div>
        <sl-tag size="small" variant="neutral">{{ clothes.length }}개</sl-tag>
        <sl-tag v-if="isAnyFilterApplied" size="small" variant="primary">필터 {{ filterAppliedCount }}</sl-tag>
      </div>
      <div class="flex items-center gap-2">
        <sl-icon-button label="필터" name="funnel" @click="onClickOpenFilterDialog"></sl-icon-button>
        <sl-button size="small" @click="onClickRefreshButton">새로고침</sl-button>
        <sl-button size="small" variant="primary" @click="onClickOpenUploadDialog">추가</sl-button>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <sl-card v-if="isClothesLoading">
        <div class="text-sm">옷장 데이터를 불러오는 중입니다.</div>
      </sl-card>

      <sl-card v-else-if="!clothes.length">
        <div class="text-sm">등록된 옷이 없습니다.</div>
      </sl-card>

      <sl-card v-for="item in clothes" :key="item.id" class="list-item-enter overflow-hidden">
        <div class="flex cursor-pointer gap-3" @click="onClickOpenDetailDialog(item)">
          <img v-if="fetchClothesImageUrl(item)" class="h-20 w-20 rounded-xl object-cover" :src="fetchClothesImageUrl(item)" alt="옷 이미지" />
          <div v-else class="flex h-20 w-20 items-center justify-center rounded-xl">
            <span class="text-xs">이미지 없음</span>
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
              <sl-tag size="small" :variant="fetchClothesStateTagVariant(item.state)">
                {{ fetchClothesStateLabel(item.state) }}
              </sl-tag>
              <span class="text-xs">{{ item.created.slice(0, 10) }}</span>
            </div>

            <div class="space-y-1 text-sm">
              <div class="truncate">카테고리: {{ fetchClothesCategoryLabel(item.category) }}</div>
              <div class="truncate">해시: {{ item.imageHash ?? '-' }}</div>
            </div>

            <div v-if="item.state === ClothesStateOptions.failed" class="text-xs font-semibold text-red-600">
              실패사유: {{ fetchClothesErrorCodeLabel(item.errorCode) }}
            </div>
            <div class="text-xs">탭해서 상세 보기</div>
          </div>
        </div>

        <sl-divider class="my-3"></sl-divider>

        <div class="grid grid-cols-2 gap-2">
          <sl-button class="w-full" size="small" :loading="isUpdatingClothes" @click.stop="onClickResetPreferenceButton(item.id)">
            선호도 초기화
          </sl-button>
          <sl-button class="w-full" size="small" variant="danger" :loading="isDeletingClothes" @click.stop="onClickDeleteButton(item)">
            삭제
          </sl-button>
          <sl-button
            v-if="item.state === ClothesStateOptions.failed"
            class="col-span-2 w-full"
            size="small"
            :loading="isUpdatingClothes"
            @click.stop="onClickRetryButton(item)"
          >
            재시도
          </sl-button>
        </div>
      </sl-card>
    </div>

    <sl-dialog label="옷 상세 정보" :open="isDetailDialogOpen" @sl-request-close="onRequestCloseDetailDialog">
      <div v-if="selectedClothes" class="flex flex-col gap-3">
        <img
          v-if="fetchClothesImageUrl(selectedClothes)"
          class="h-56 w-full rounded-2xl object-contain"
          :src="fetchClothesImageUrl(selectedClothes)"
          alt="옷 상세 이미지"
        />
        <div v-else class="flex h-40 items-center justify-center rounded-2xl">
          <span class="text-sm">이미지 없음</span>
        </div>

        <div class="flex items-center justify-between">
          <sl-tag size="small" :variant="fetchClothesStateTagVariant(selectedClothes.state)">
            {{ fetchClothesStateLabel(selectedClothes.state) }}
          </sl-tag>
          <span class="text-xs">{{ selectedClothes.updated.slice(0, 10) }}</span>
        </div>

        <div class="space-y-1 rounded-xl p-3 text-sm">
          <div class="truncate">이미지 해시: {{ selectedClothes.imageHash ?? '-' }}</div>
          <div>임베딩 모델: {{ selectedClothes.embeddingModel ?? '-' }}</div>
          <div>임베딩 차원: {{ fetchEmbeddingDimension(selectedClothes.embedding) }}</div>
        </div>

        <sl-select label="카테고리" :value="detailForm.category" @sl-change="onChangeDetailCategory">
          <sl-option value="">선택 안함</sl-option>
          <sl-option v-for="option in clothesCategoryOptionList" :key="option.value" :value="option.value">
            {{ option.label }}
          </sl-option>
        </sl-select>

        <sl-select label="계절" multiple clearable :value="detailForm.seasons" @sl-change="onChangeDetailSeasons">
          <sl-option v-for="option in clothesSeasonsOptionList" :key="option.value" :value="option.value">
            {{ option.label }}
          </sl-option>
        </sl-select>

        <sl-select label="색상" multiple clearable :value="detailForm.colors" @sl-change="onChangeDetailColors">
          <sl-option v-for="option in clothesColorsOptionList" :key="option.value" :value="option.value">
            {{ option.label }}
          </sl-option>
        </sl-select>

        <sl-select label="스타일" multiple clearable :value="detailForm.styles" @sl-change="onChangeDetailStyles">
          <sl-option v-for="option in clothesStylesOptionList" :key="option.value" :value="option.value">
            {{ option.label }}
          </sl-option>
        </sl-select>

        <sl-select label="핏" :value="detailForm.fit" @sl-change="onChangeDetailFit">
          <sl-option value="">선택 안함</sl-option>
          <sl-option v-for="option in clothesFitOptionList" :key="option.value" :value="option.value">
            {{ option.label }}
          </sl-option>
        </sl-select>

        <sl-select label="소재" multiple clearable :value="detailForm.materials" @sl-change="onChangeDetailMaterials">
          <sl-option v-for="option in clothesMaterialsOptionList" :key="option.value" :value="option.value">
            {{ option.label }}
          </sl-option>
        </sl-select>

        <sl-select label="상황" multiple clearable :value="detailForm.contexts" @sl-change="onChangeDetailContexts">
          <sl-option v-for="option in clothesContextsOptionList" :key="option.value" :value="option.value">
            {{ option.label }}
          </sl-option>
        </sl-select>

        <sl-input v-model="detailForm.preferenceScore" label="선호도 점수" type="number"></sl-input>

        <sl-input
          v-model="detailForm.sourceUrl"
          label="원본 이미지 URL"
          placeholder="https://example.com/item.jpg"
          type="url"
          :disabled="selectedClothes.sourceType !== 'url'"
        ></sl-input>

        <div class="space-y-1 rounded-xl p-3 text-sm">
          <div>카테고리: {{ fetchClothesCategoryLabel(detailForm.category || null) }}</div>
          <div>계절: {{ fetchClothesSeasonsLabel(detailForm.seasons) }}</div>
          <div>색상: {{ fetchClothesColorsLabel(detailForm.colors) }}</div>
          <div>스타일: {{ fetchClothesStylesLabel(detailForm.styles) }}</div>
          <div>핏: {{ fetchClothesFitLabel(detailForm.fit || null) }}</div>
          <div>소재: {{ fetchClothesMaterialsLabel(detailForm.materials) }}</div>
          <div>상황: {{ fetchClothesContextsLabel(detailForm.contexts) }}</div>
        </div>

        <div class="rounded-xl p-3 text-sm">
          저장하면 수정한 메타데이터를 기준으로 임베딩을 다시 생성합니다.
        </div>
      </div>

      <sl-button slot="footer" class="mr-2" @click="onRequestCloseDetailDialog">닫기</sl-button>
      <sl-button
        slot="footer"
        class="ml-2"
        variant="primary"
        :loading="isUpdatingClothes || isReembeddingClothes"
        @click="onClickSaveDetailButton"
      >
        저장 후 재임베딩
      </sl-button>
    </sl-dialog>

    <sl-dialog label="옷 데이터 입력" :open="isUploadDialogOpen" @sl-request-close="onRequestCloseUploadDialog">
      <div class="grid grid-cols-2 gap-2">
        <sl-button class="w-full" size="small" :variant="uploadType === 'file' ? 'primary' : 'default'" @click="onClickSelectUploadType('file')">
          파일
        </sl-button>
        <sl-button class="w-full" size="small" :variant="uploadType === 'url' ? 'primary' : 'default'" @click="onClickSelectUploadType('url')">
          URL
        </sl-button>
      </div>

      <div v-if="uploadType === 'file'" class="mt-3 flex flex-col gap-2 p-1">
        <label class="text-sm font-semibold">이미지 파일</label>
        <div class="rounded-xl p-3">
          <input ref="uploadSourceFileInputElement" class="sr-only" type="file" accept="image/*" @change="onChangeUploadFileInput" />
          <div class="flex items-center gap-2">
            <sl-button size="small" @click="onClickOpenUploadSourceFileButton">파일 선택</sl-button>
            <sl-tag size="small" :variant="uploadSourceFile ? 'success' : 'neutral'">
              {{ uploadSourceFile ? '선택됨' : '미선택' }}
            </sl-tag>
          </div>
          <div class="mt-2 text-sm">
            <p class="truncate">{{ uploadSourceFile ? uploadSourceFile.name : '선택된 파일 없음' }}</p>
            <p class="mt-1 text-xs">지원 형식: 이미지 파일</p>
          </div>
        </div>
      </div>

      <div v-else class="mt-3 flex flex-col gap-3 p-1">
        <sl-input v-model="uploadSourceUrl" type="url" label="이미지 URL" placeholder="https://example.com/item.jpg"></sl-input>
      </div>

      <sl-button class="mt-3 w-full" variant="primary" :loading="isCreatingClothes" @click="onClickUploadButton">업로드</sl-button>
      <sl-button slot="footer" @click="onRequestCloseUploadDialog">닫기</sl-button>
    </sl-dialog>

    <sl-dialog label="필터" :open="isFilterDialogOpen" @sl-request-close="onRequestCloseFilterDialog">
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm font-semibold">카테고리/메타데이터</div>
          <sl-button size="small" @click="onClickResetFilterDialogButton">초기화</sl-button>
        </div>

        <sl-input v-model="filterDialogSearchText" clearable type="search" placeholder="해시 또는 URL 검색"></sl-input>

        <div class="grid grid-cols-2 gap-2">
          <sl-select label="카테고리" multiple clearable :value="filterDialogCategories" @sl-change="onChangeFilterDialogCategories">
            <sl-option v-for="option in clothesCategoryOptionList" :key="option.value" :value="option.value">
              {{ option.label }}
            </sl-option>
          </sl-select>

          <sl-select label="계절" multiple clearable :value="filterDialogSeasons" @sl-change="onChangeFilterDialogSeasons">
            <sl-option v-for="option in clothesSeasonsOptionList" :key="option.value" :value="option.value">
              {{ option.label }}
            </sl-option>
          </sl-select>

          <sl-select label="색상" multiple clearable :value="filterDialogColors" @sl-change="onChangeFilterDialogColors">
            <sl-option v-for="option in clothesColorsOptionList" :key="option.value" :value="option.value">
              {{ option.label }}
            </sl-option>
          </sl-select>

          <sl-select label="스타일" multiple clearable :value="filterDialogStyles" @sl-change="onChangeFilterDialogStyles">
            <sl-option v-for="option in clothesStylesOptionList" :key="option.value" :value="option.value">
              {{ option.label }}
            </sl-option>
          </sl-select>

          <sl-select label="소재" multiple clearable :value="filterDialogMaterials" @sl-change="onChangeFilterDialogMaterials">
            <sl-option v-for="option in clothesMaterialsOptionList" :key="option.value" :value="option.value">
              {{ option.label }}
            </sl-option>
          </sl-select>

          <sl-select label="상황" multiple clearable :value="filterDialogContexts" @sl-change="onChangeFilterDialogContexts">
            <sl-option v-for="option in clothesContextsOptionList" :key="option.value" :value="option.value">
              {{ option.label }}
            </sl-option>
          </sl-select>

          <sl-select label="핏" clearable :value="filterDialogFit" @sl-change="onChangeFilterDialogFit">
            <sl-option value="ALL">전체</sl-option>
            <sl-option v-for="option in clothesFitOptionList" :key="option.value" :value="option.value">
              {{ option.label }}
            </sl-option>
          </sl-select>
        </div>
      </div>

      <sl-button slot="footer" class="mr-2" @click="onRequestCloseFilterDialog">닫기</sl-button>
      <sl-button slot="footer" class="ml-2" variant="primary" @click="onClickApplyFilterDialogButton">적용</sl-button>
    </sl-dialog>
  </main>
</template>

<script setup lang="ts">
import {
  ClothesCategoryOptions,
  ClothesColorsOptions,
  ClothesContextsOptions,
  ClothesFitOptions,
  ClothesMaterialsOptions,
  ClothesSeasonsOptions,
  ClothesStateOptions,
  ClothesStylesOptions,
  type ClothesResponse,
} from '@/api/pocketbase-types';
import { useAuth } from '@/composables/auth';
import { useClothes } from '@/composables/clothes';
import { type RecommendationItem, useRecommendations } from '@/composables/recommendations';
import { type CityWeather, useWeather } from '@/composables/weather';
import {
  clothesCategoryOptionList,
  clothesColorsOptionList,
  clothesContextsOptionList,
  clothesFitOptionList,
  clothesMaterialsOptionList,
  clothesSeasonsOptionList,
  clothesStylesOptionList,
  fetchClothesCategoryLabel,
  fetchClothesColorsLabel,
  fetchClothesContextsLabel,
  fetchClothesErrorCodeLabel,
  fetchClothesFitLabel,
  fetchClothesMaterialsLabel,
  fetchClothesSeasonsLabel,
  fetchClothesStateLabel,
  fetchClothesStateTagVariant,
  fetchClothesStylesLabel,
} from '@/ui/clothes.ui';
import { readShoelaceChecked, readShoelaceMultiValue, readShoelaceSingleValue, useModal } from '@packages/ui';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

type ClothesDetailForm = {
  category: ClothesCategoryOptions | '';
  colors: ClothesColorsOptions[];
  contexts: ClothesContextsOptions[];
  fit: ClothesFitOptions | '';
  materials: ClothesMaterialsOptions[];
  preferenceScore: string;
  seasons: ClothesSeasonsOptions[];
  sourceUrl: string;
  styles: ClothesStylesOptions[];
};

type ClothesFilterParams = {
  categories: ClothesCategoryOptions[];
  colors: ClothesColorsOptions[];
  contexts: ClothesContextsOptions[];
  fit: ClothesFitOptions | 'ALL';
  materials: ClothesMaterialsOptions[];
  seasons: ClothesSeasonsOptions[];
  searchText: string;
  styles: ClothesStylesOptions[];
};

/* ======================= 변수 ======================= */
const router = useRouter();
const { showMessageModal, showConfirmModal } = useModal();
const { fetchAuthState, deleteAuthSession } = useAuth();
const {
  clothes,
  isClothesLoading,
  isCreatingClothes,
  isUpdatingClothes,
  isDeletingClothes,
  isReembeddingClothes,
  fetchClothesList,
  fetchClothesDetail,
  createClothesByFile,
  createClothesByUrl,
  updateClothes,
  deleteClothes,
  updateClothesRetry,
  updateClothesReembed,
  fetchClothesImageUrl,
} =
  useClothes();
const {
  recommendationItems,
  recommendationSessionId,
  recommendationRound,
  isCreatingRecommendationSession,
  isUpdatingRecommendationReroll,
  isCreatingRecommendationConfirm,
  createRecommendationSession,
  updateRecommendationItemPinned,
  updateRecommendationReroll,
  createRecommendationConfirm,
  resetRecommendationSession,
} = useRecommendations();
const { anyangWeather, seongnamWeather, isWeatherLoading, fetchMajorCitiesWeather } = useWeather();
const filterSearchText = ref('');
const filterCategories = ref<ClothesCategoryOptions[]>([]);
const filterSeasons = ref<ClothesSeasonsOptions[]>([]);
const filterColors = ref<ClothesColorsOptions[]>([]);
const filterStyles = ref<ClothesStylesOptions[]>([]);
const filterMaterials = ref<ClothesMaterialsOptions[]>([]);
const filterContexts = ref<ClothesContextsOptions[]>([]);
const filterFit = ref<ClothesFitOptions | 'ALL'>('ALL');
const isFilterDialogOpen = ref(false);
const filterDialogSearchText = ref('');
const filterDialogCategories = ref<ClothesCategoryOptions[]>([]);
const filterDialogSeasons = ref<ClothesSeasonsOptions[]>([]);
const filterDialogColors = ref<ClothesColorsOptions[]>([]);
const filterDialogStyles = ref<ClothesStylesOptions[]>([]);
const filterDialogMaterials = ref<ClothesMaterialsOptions[]>([]);
const filterDialogContexts = ref<ClothesContextsOptions[]>([]);
const filterDialogFit = ref<ClothesFitOptions | 'ALL'>('ALL');
const uploadType = ref<'file' | 'url'>('file');
const uploadSourceUrl = ref('');
const uploadSourceFile = ref<File | null>(null);
const uploadSourceFileInputElement = ref<HTMLInputElement | null>(null);
const isUploadDialogOpen = ref(false);
const recommendationQueryText = ref('');
const recommendationTopKInput = ref(12);
const recommendationWornDate = ref('');
const recommendationNote = ref('');
const isDetailDialogOpen = ref(false);
const selectedClothes = ref<ClothesResponse | null>(null);
const detailForm = ref<ClothesDetailForm>({
  category: '',
  colors: [],
  contexts: [],
  fit: '',
  materials: [],
  preferenceScore: '0',
  seasons: [],
  sourceUrl: '',
  styles: [],
});
const isAnyFilterApplied = computed(() => {
  return Boolean(
    filterSearchText.value.trim() ||
      filterCategories.value.length ||
      filterSeasons.value.length ||
      filterColors.value.length ||
      filterStyles.value.length ||
      filterMaterials.value.length ||
      filterContexts.value.length ||
      filterFit.value !== 'ALL',
  );
});
const filterAppliedCount = computed(() => {
  let count = 0;
  if (filterSearchText.value.trim()) count += 1;
  if (filterCategories.value.length) count += 1;
  if (filterSeasons.value.length) count += 1;
  if (filterColors.value.length) count += 1;
  if (filterStyles.value.length) count += 1;
  if (filterMaterials.value.length) count += 1;
  if (filterContexts.value.length) count += 1;
  if (filterFit.value !== 'ALL') count += 1;
  return count;
});
const recommendationTemperatureSeasons = computed(() => {
  return fetchDefaultRecommendationSeasonsByAnyangWeather(anyangWeather.value);
});
const recommendationTemperatureSeason = computed<ClothesSeasonsOptions | null>(() => {
  return recommendationTemperatureSeasons.value[0] ?? null;
});
const recommendationTemperatureSeasonLabel = computed(() => {
  if (!recommendationTemperatureSeason.value) {
    return '';
  }

  return fetchClothesSeasonsLabel([recommendationTemperatureSeason.value]);
});
const recommendationTemperatureSeasonIconName = computed(() => {
  switch (recommendationTemperatureSeason.value) {
    case ClothesSeasonsOptions.spring:
      return 'flower1';
    case ClothesSeasonsOptions.summer:
      return 'sun';
    case ClothesSeasonsOptions.fall:
      return 'leaf';
    case ClothesSeasonsOptions.winter:
      return 'snow';
    default:
      return 'calendar3';
  }
});
const recommendationTemperatureSeasonTagVariant = computed(() => {
  switch (recommendationTemperatureSeason.value) {
    case ClothesSeasonsOptions.spring:
      return 'success';
    case ClothesSeasonsOptions.summer:
      return 'warning';
    case ClothesSeasonsOptions.fall:
      return 'primary';
    case ClothesSeasonsOptions.winter:
      return 'neutral';
    default:
      return 'neutral';
  }
});
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(async () => {
  if (!fetchAuthState()) {
    await router.push('/sign');
    return;
  }

  recommendationWornDate.value = fetchTodayDateText();
  await fetchClothesList();
  await fetchMajorCitiesWeather();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickSignoutButton = async () => {
  await deleteAuthSession();
};

const onClickSelectUploadType = (type: 'file' | 'url') => {
  uploadType.value = type;
};

const onClickOpenUploadDialog = () => {
  isUploadDialogOpen.value = true;
};

const onRequestCloseUploadDialog = () => {
  isUploadDialogOpen.value = false;
};

const onChangeUploadFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  uploadSourceFile.value = target?.files?.[0] ?? null;
};

const onClickOpenUploadSourceFileButton = () => {
  if (!uploadSourceFileInputElement.value) {
    return;
  }

  uploadSourceFileInputElement.value.value = '';
  uploadSourceFileInputElement.value.click();
};

const onClickUploadButton = async () => {
  if (uploadType.value === 'file') {
    if (!uploadSourceFile.value) {
      showMessageModal('업로드할 이미지 파일을 선택해주세요.');
      return;
    }

    await createClothesByFile(uploadSourceFile.value);
    uploadSourceFile.value = null;
  } else {
    if (!uploadSourceUrl.value.trim()) {
      showMessageModal('업로드할 이미지 URL을 입력해주세요.');
      return;
    }

    await createClothesByUrl(uploadSourceUrl.value.trim());
    uploadSourceUrl.value = '';
  }

  await fetchClothesList(fetchCurrentFilterParams());
  isUploadDialogOpen.value = false;
};

const fetchTodayDateText = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const fetchDefaultRecommendationSeasonsByAnyangWeather = (weather: CityWeather | null): ClothesSeasonsOptions[] => {
  if (!weather) {
    return [];
  }

  const minTemp = Number(weather.minTemp);
  const maxTemp = Number(weather.maxTemp);
  if (!Number.isFinite(minTemp) || !Number.isFinite(maxTemp)) {
    return [];
  }

  const averageTemp = (minTemp + maxTemp) / 2;
  if (averageTemp >= 23) {
    return [ClothesSeasonsOptions.summer];
  }

  if (averageTemp >= 17) {
    return [ClothesSeasonsOptions.fall];
  }

  if (averageTemp >= 9) {
    return [ClothesSeasonsOptions.spring];
  }

  return [ClothesSeasonsOptions.winter];
};

const fetchCityWeatherLabel = (cityName: string, weather: CityWeather | null) => {
  if (isWeatherLoading.value && !weather) {
    return `${cityName} 날씨 확인 중`;
  }

  if (!weather) {
    return `${cityName} 날씨 없음`;
  }

  const minTemp = Number(weather.minTemp).toFixed(1);
  const maxTemp = Number(weather.maxTemp).toFixed(1);
  const staleSuffix = weather.stale ? ' (캐시)' : '';
  return `${cityName} ${minTemp}° / ${maxTemp}°${staleSuffix}`;
};

const fetchCityWeatherTagVariant = (weather: CityWeather | null) => {
  if (weather?.stale) {
    return 'warning';
  }

  return 'neutral';
};

const fetchCurrentFilterParams = (): ClothesFilterParams => {
  return {
    categories: [...filterCategories.value],
    colors: [...filterColors.value],
    contexts: [...filterContexts.value],
    fit: filterFit.value,
    materials: [...filterMaterials.value],
    seasons: [...filterSeasons.value],
    searchText: filterSearchText.value,
    styles: [...filterStyles.value],
  };
};

const syncFilterDialogByCurrentFilter = () => {
  filterDialogSearchText.value = filterSearchText.value;
  filterDialogCategories.value = [...filterCategories.value];
  filterDialogSeasons.value = [...filterSeasons.value];
  filterDialogColors.value = [...filterColors.value];
  filterDialogStyles.value = [...filterStyles.value];
  filterDialogMaterials.value = [...filterMaterials.value];
  filterDialogContexts.value = [...filterContexts.value];
  filterDialogFit.value = filterFit.value;
};

const onClickOpenFilterDialog = () => {
  syncFilterDialogByCurrentFilter();
  isFilterDialogOpen.value = true;
};

const onRequestCloseFilterDialog = () => {
  isFilterDialogOpen.value = false;
};

const onChangeFilterDialogCategories = (event: Event) => {
  filterDialogCategories.value = readShoelaceMultiValue(event) as ClothesCategoryOptions[];
};

const onChangeFilterDialogSeasons = (event: Event) => {
  filterDialogSeasons.value = readShoelaceMultiValue(event) as ClothesSeasonsOptions[];
};

const onChangeFilterDialogColors = (event: Event) => {
  filterDialogColors.value = readShoelaceMultiValue(event) as ClothesColorsOptions[];
};

const onChangeFilterDialogStyles = (event: Event) => {
  filterDialogStyles.value = readShoelaceMultiValue(event) as ClothesStylesOptions[];
};

const onChangeFilterDialogMaterials = (event: Event) => {
  filterDialogMaterials.value = readShoelaceMultiValue(event) as ClothesMaterialsOptions[];
};

const onChangeFilterDialogContexts = (event: Event) => {
  filterDialogContexts.value = readShoelaceMultiValue(event) as ClothesContextsOptions[];
};

const onChangeFilterDialogFit = (event: Event) => {
  const value = readShoelaceSingleValue(event);
  filterDialogFit.value = (value || 'ALL') as ClothesFitOptions | 'ALL';
};

const onClickResetFilterDialogButton = () => {
  filterDialogSearchText.value = '';
  filterDialogCategories.value = [];
  filterDialogSeasons.value = [];
  filterDialogColors.value = [];
  filterDialogStyles.value = [];
  filterDialogMaterials.value = [];
  filterDialogContexts.value = [];
  filterDialogFit.value = 'ALL';
};

const onClickApplyFilterDialogButton = async () => {
  filterSearchText.value = filterDialogSearchText.value;
  filterCategories.value = [...filterDialogCategories.value];
  filterSeasons.value = [...filterDialogSeasons.value];
  filterColors.value = [...filterDialogColors.value];
  filterStyles.value = [...filterDialogStyles.value];
  filterMaterials.value = [...filterDialogMaterials.value];
  filterContexts.value = [...filterDialogContexts.value];
  filterFit.value = filterDialogFit.value;

  await fetchClothesList(fetchCurrentFilterParams());
  isFilterDialogOpen.value = false;
};

const onChangeRecommendationTopK = (event: Event) => {
  const parsed = Number(readShoelaceSingleValue(event));
  if (!Number.isFinite(parsed)) {
    return;
  }

  recommendationTopKInput.value = Math.min(50, Math.max(1, Math.trunc(parsed)));
};

const onClickRequestRecommendationButton = async () => {
  const normalizedQuery = recommendationQueryText.value.trim();
  if (!normalizedQuery) {
    showMessageModal('원하는 코디 문장을 입력해주세요.');
    return;
  }

  const result = await createRecommendationSession({
    queryText: normalizedQuery,
    seasons: recommendationTemperatureSeasons.value,
    topK: recommendationTopKInput.value,
  });

  recommendationTopKInput.value = result.topK;
  recommendationNote.value = '';
  recommendationWornDate.value = fetchTodayDateText();
};

const onChangeRecommendationPin = (itemId: string, event: Event) => {
  const isChecked = readShoelaceChecked(event);
  updateRecommendationItemPinned(itemId, isChecked);
};

const onClickRerollRecommendationButton = async () => {
  if (!recommendationSessionId.value || !recommendationItems.value.length) {
    showMessageModal('먼저 추천받기를 진행해주세요.');
    return;
  }

  await updateRecommendationReroll();
};

const onClickConfirmRecommendationButton = async () => {
  if (!recommendationSessionId.value || !recommendationItems.value.length) {
    showMessageModal('확정할 추천 코디가 없습니다.');
    return;
  }

  if (!recommendationWornDate.value.trim()) {
    showMessageModal('착용일을 입력해주세요.');
    return;
  }

  const result = await createRecommendationConfirm({
    note: recommendationNote.value.trim(),
    wornDate: recommendationWornDate.value.trim(),
  });

  await fetchClothesList(fetchCurrentFilterParams());

  resetRecommendationSession();
  recommendationNote.value = '';
  recommendationWornDate.value = result.wornDate;
  showMessageModal(`${result.wornDate} 착용 로그로 ${result.selectedCount}개 아이템을 저장했습니다.`);
};

const fetchRecommendationItemImageUrl = (item: RecommendationItem) => {
  const clothesId = String(item.clothes?.id ?? '').trim();
  if (clothesId) {
    const clothesItem = clothes.value.find((data) => data.id === clothesId);
    if (clothesItem) {
      return fetchClothesImageUrl(clothesItem);
    }
  }

  return String(item.clothes?.sourceUrl ?? '').trim();
};

const fetchRecommendationCategoryLabel = (category: ClothesCategoryOptions | '') => {
  if (!category) {
    return '-';
  }

  return fetchClothesCategoryLabel(category);
};

const fetchRecommendationSimilarityLabel = (similarity: number) => {
  if (!Number.isFinite(similarity) || similarity < 0) {
    return '-';
  }

  return `${(similarity * 100).toFixed(1)}%`;
};

const fetchRecommendationSummaryLabel = (item: RecommendationItem) => {
  if (!item.clothes) {
    return '추천 옷 정보를 찾지 못했습니다.';
  }

  const styleLabel = fetchClothesStylesLabel(item.clothes.styles);
  const colorLabel = fetchClothesColorsLabel(item.clothes.colors);
  return `스타일 ${styleLabel} / 색상 ${colorLabel}`;
};

const onClickOpenRecommendationDetailButton = async (item: RecommendationItem) => {
  const clothesId = String(item.clothes?.id ?? '').trim();
  if (!clothesId) {
    showMessageModal('추천 옷 상세 데이터를 찾지 못했습니다.');
    return;
  }

  const detail = await fetchClothesDetail(clothesId);
  onClickOpenDetailDialog(detail);
};

const onClickRefreshButton = async () => {
  await fetchClothesList(fetchCurrentFilterParams());
};

const onClickRetryButton = async (item: ClothesResponse) => {
  await updateClothesRetry(item);
};

const onClickResetPreferenceButton = async (id: string) => {
  await updateClothes(id, {
    preferenceScore: 0,
  });
};

const onClickDeleteButton = (item: ClothesResponse) => {
  showConfirmModal({
    cancelText: '취소',
    confirmText: '삭제',
    message: '선택한 옷 데이터를 삭제할까요?',
    onConfirm: async () => {
      await deleteClothes(item.id);
      await fetchClothesList(fetchCurrentFilterParams());
    },
    title: '옷 삭제',
  });
};

const createDetailFormByItem = (item: ClothesResponse): ClothesDetailForm => {
  return {
    category: item.category ?? '',
    colors: Array.isArray(item.colors) ? [...item.colors] : [],
    contexts: Array.isArray(item.contexts) ? [...item.contexts] : [],
    fit: item.fit ?? '',
    materials: Array.isArray(item.materials) ? [...item.materials] : [],
    preferenceScore: String(item.preferenceScore ?? 0),
    seasons: Array.isArray(item.seasons) ? [...item.seasons] : [],
    sourceUrl: String(item.sourceUrl ?? ''),
    styles: Array.isArray(item.styles) ? [...item.styles] : [],
  };
};

const onClickOpenDetailDialog = (item: ClothesResponse) => {
  selectedClothes.value = item;
  detailForm.value = createDetailFormByItem(item);
  isDetailDialogOpen.value = true;
};

const onRequestCloseDetailDialog = () => {
  isDetailDialogOpen.value = false;
  selectedClothes.value = null;
};

const onChangeDetailCategory = (event: Event) => {
  const value = readShoelaceSingleValue(event);
  detailForm.value.category = (value || '') as ClothesCategoryOptions | '';
};

const onChangeDetailSeasons = (event: Event) => {
  detailForm.value.seasons = readShoelaceMultiValue(event) as ClothesSeasonsOptions[];
};

const onChangeDetailColors = (event: Event) => {
  detailForm.value.colors = readShoelaceMultiValue(event) as ClothesColorsOptions[];
};

const onChangeDetailStyles = (event: Event) => {
  detailForm.value.styles = readShoelaceMultiValue(event) as ClothesStylesOptions[];
};

const onChangeDetailFit = (event: Event) => {
  const value = readShoelaceSingleValue(event);
  detailForm.value.fit = (value || '') as ClothesFitOptions | '';
};

const onChangeDetailMaterials = (event: Event) => {
  detailForm.value.materials = readShoelaceMultiValue(event) as ClothesMaterialsOptions[];
};

const onChangeDetailContexts = (event: Event) => {
  detailForm.value.contexts = readShoelaceMultiValue(event) as ClothesContextsOptions[];
};

const onClickSaveDetailButton = async () => {
  if (!selectedClothes.value) {
    return;
  }

  const parsedPreferenceScore = Number(detailForm.value.preferenceScore);
  if (!Number.isFinite(parsedPreferenceScore)) {
    showMessageModal('선호도 점수는 숫자만 입력해주세요.');
    return;
  }

  await updateClothes(selectedClothes.value.id, {
    category: detailForm.value.category || undefined,
    colors: detailForm.value.colors,
    contexts: detailForm.value.contexts,
    fit: detailForm.value.fit || undefined,
    materials: detailForm.value.materials,
    preferenceScore: parsedPreferenceScore,
    seasons: detailForm.value.seasons,
    sourceUrl: detailForm.value.sourceUrl || undefined,
    styles: detailForm.value.styles,
  });

  await updateClothesReembed(selectedClothes.value.id);
  await fetchClothesList(fetchCurrentFilterParams());

  const refreshedClothes = clothes.value.find((item) => item.id === selectedClothes.value?.id);
  if (refreshedClothes) {
    selectedClothes.value = refreshedClothes;
    detailForm.value = createDetailFormByItem(refreshedClothes);
  }

  showMessageModal('수정된 메타데이터 기준으로 임베딩을 다시 생성했습니다.');
};

const fetchEmbeddingDimension = (embedding: unknown) => {
  if (!Array.isArray(embedding)) {
    return 0;
  }

  return embedding.length;
};

/* ======================= 메서드 ======================= */
</script>
