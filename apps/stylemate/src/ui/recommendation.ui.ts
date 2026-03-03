import {
  ClothesCategoryOptions,
  ClothesSeasonsOptions,
  ClothesStateOptions,
  type ClothesResponse,
} from '@/api/pocketbase-types';
export { isClothesProcessingState } from '@/composables/clothes';
import type { RecommendationItem } from '@/composables/recommendations';
import type { CityWeather } from '@/composables/weather';

export type RecommendationSlotCategory =
  | ClothesCategoryOptions.top
  | ClothesCategoryOptions.bottom
  | ClothesCategoryOptions.shoes
  | ClothesCategoryOptions.accessory;

export type RecommendationSlotCandidate = {
  category: RecommendationSlotCategory;
  clothes: NonNullable<RecommendationItem['clothes']>;
  clothesId: string;
  isRecommended: boolean;
  itemId: string;
  similarity: number;
};

export type RecommendationSelectionIndexByCategory = Record<RecommendationSlotCategory, number>;

export const recommendationSlotCategoryOrder: RecommendationSlotCategory[] = [
  ClothesCategoryOptions.top,
  ClothesCategoryOptions.bottom,
  ClothesCategoryOptions.shoes,
  ClothesCategoryOptions.accessory,
];

const createEmptyCandidateMap = (): Record<RecommendationSlotCategory, RecommendationSlotCandidate[]> => ({
  [ClothesCategoryOptions.top]: [],
  [ClothesCategoryOptions.bottom]: [],
  [ClothesCategoryOptions.shoes]: [],
  [ClothesCategoryOptions.accessory]: [],
});

const createEmptySelectedCandidateMap = (): Record<RecommendationSlotCategory, RecommendationSlotCandidate | null> => ({
  [ClothesCategoryOptions.top]: null,
  [ClothesCategoryOptions.bottom]: null,
  [ClothesCategoryOptions.shoes]: null,
  [ClothesCategoryOptions.accessory]: null,
});

export const isDirectImageSourceUrl = (value: string) => {
  const normalizedValue = String(value ?? '').trim();
  if (!/^https?:\/\//i.test(normalizedValue)) {
    return false;
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    return /\.(?:jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(String(parsedUrl.pathname ?? ''));
  } catch {
    const withoutHash = normalizedValue.split('#')[0] ?? '';
    const withoutQuery = withoutHash.split('?')[0] ?? '';
    return /\.(?:jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(withoutQuery);
  }
};

export const fetchDefaultRecommendationSeasonsByAnyangWeather = (weather: CityWeather | null): ClothesSeasonsOptions[] => {
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

export const fetchClothesProcessingProgressValue = (state: ClothesStateOptions | null | undefined) => {
  switch (state) {
    case ClothesStateOptions.uploaded:
      return 10;
    case ClothesStateOptions.preprocessing:
      return 35;
    case ClothesStateOptions.analyzing:
      return 65;
    case ClothesStateOptions.embedding:
      return 85;
    default:
      return 100;
  }
};

export const buildRecommendationCandidatesByCategory = (
  recommendationItems: RecommendationItem[],
  clothesItems: ClothesResponse[],
  categoryOrder: RecommendationSlotCategory[] = recommendationSlotCategoryOrder,
) => {
  const groupedCandidates = createEmptyCandidateMap();

  const appendCandidate = (category: RecommendationSlotCategory, candidate: RecommendationSlotCandidate) => {
    const currentCandidates = groupedCandidates[category];
    if (currentCandidates.some((item) => item.clothesId === candidate.clothesId)) {
      return;
    }

    currentCandidates.push(candidate);
  };

  recommendationItems.forEach((item) => {
    const category = item.category;
    if (!categoryOrder.includes(category as RecommendationSlotCategory) || !item.clothes) {
      return;
    }

    const clothesId = String(item.clothes.id ?? '').trim();
    if (!clothesId) {
      return;
    }

    appendCandidate(category as RecommendationSlotCategory, {
      category: category as RecommendationSlotCategory,
      clothes: item.clothes,
      clothesId,
      isRecommended: true,
      itemId: item.itemId,
      similarity: item.similarity,
    });
  });

  clothesItems.forEach((item) => {
    const category = item.category;
    if (!categoryOrder.includes(category as RecommendationSlotCategory)) {
      return;
    }

    if (item.state !== ClothesStateOptions.done) {
      return;
    }

    const clothesId = String(item.id ?? '').trim();
    if (!clothesId) {
      return;
    }

    appendCandidate(category as RecommendationSlotCategory, {
      category: category as RecommendationSlotCategory,
      clothes: {
        category: item.category ?? '',
        colors: Array.isArray(item.colors) ? item.colors : [],
        contexts: Array.isArray(item.contexts) ? item.contexts : [],
        fit: item.fit ?? '',
        id: clothesId,
        imageHash: String(item.imageHash ?? ''),
        materials: Array.isArray(item.materials) ? item.materials : [],
        preferenceScore: Number(item.preferenceScore ?? 0),
        seasons: Array.isArray(item.seasons) ? item.seasons : [],
        sourceImage: String(item.sourceImage ?? ''),
        sourceUrl: String(item.sourceUrl ?? ''),
        styles: Array.isArray(item.styles) ? item.styles : [],
      },
      clothesId,
      isRecommended: false,
      itemId: '',
      similarity: -1,
    });
  });

  return groupedCandidates;
};

export const buildSelectedRecommendationCandidatesByCategory = (
  candidatesByCategory: Record<RecommendationSlotCategory, RecommendationSlotCandidate[]>,
  selectionIndexByCategory: RecommendationSelectionIndexByCategory,
  categoryOrder: RecommendationSlotCategory[] = recommendationSlotCategoryOrder,
) => {
  const selectedCandidates = createEmptySelectedCandidateMap();

  categoryOrder.forEach((category) => {
    const candidates = candidatesByCategory[category];
    const selectedIndex = selectionIndexByCategory[category] ?? 0;
    if (!candidates.length) {
      selectedCandidates[category] = null;
      return;
    }

    selectedCandidates[category] = candidates[Math.max(0, Math.min(selectedIndex, candidates.length - 1))] ?? null;
  });

  return selectedCandidates;
};

export const fetchRecommendationSelectionPositionLabel = (
  candidates: RecommendationSlotCandidate[],
  selectedIndex: number,
) => {
  if (!candidates.length) {
    return '0/0';
  }

  const normalizedIndex = Math.max(0, Math.min(selectedIndex, candidates.length - 1));
  return `${normalizedIndex + 1}/${candidates.length}`;
};
