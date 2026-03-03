import {
  ClothesCategoryOptions,
  ClothesFitOptions,
  ClothesSeasonsOptions,
  ClothesStateOptions,
  type ClothesResponse,
} from '@/api/pocketbase-types';
import type { RecommendationItem } from '@/composables/recommendations';
import type { CityWeather } from '@/composables/weather';
import {
  buildRecommendationCandidatesByCategory,
  buildSelectedRecommendationCandidatesByCategory,
  fetchClothesProcessingProgressValue,
  fetchDefaultRecommendationSeasonsByAnyangWeather,
  fetchRecommendationSelectionPositionLabel,
  isClothesProcessingState,
  isDirectImageSourceUrl,
  recommendationSlotCategoryOrder,
  type RecommendationSelectionIndexByCategory,
  type RecommendationSlotCandidate,
} from '@/ui/recommendation.ui';
import { describe, expect, test } from 'vitest';

const createWeather = (minTemp: number, maxTemp: number): CityWeather => ({
  date: '2026-03-03',
  location: 'anyang',
  maxTemp,
  minTemp,
  stale: false,
  updatedAt: '2026-03-03 00:00:00.000Z',
});

const createRecommendationClothes = (
  id: string,
  category: ClothesCategoryOptions = ClothesCategoryOptions.top,
): NonNullable<RecommendationItem['clothes']> => ({
  category,
  colors: [],
  contexts: [],
  fit: ClothesFitOptions.regular,
  id,
  imageHash: `${id}-hash`,
  materials: [],
  preferenceScore: 0,
  seasons: [],
  sourceImage: '',
  sourceUrl: `https://example.com/${id}.jpg`,
  styles: [],
});

const createRecommendationItem = (args: Partial<RecommendationItem> = {}): RecommendationItem => ({
  category: ClothesCategoryOptions.top,
  clothes: createRecommendationClothes('recommended-top-1'),
  isPinned: false,
  itemId: 'item-1',
  rank: 1,
  round: 1,
  similarity: 0.9,
  ...args,
});

const createClothes = (args: Partial<ClothesResponse> = {}): ClothesResponse =>
  ({
    category: ClothesCategoryOptions.top,
    colors: [],
    contexts: [],
    fit: ClothesFitOptions.regular,
    id: 'clothes-1',
    imageHash: 'clothes-1-hash',
    materials: [],
    preferenceScore: 0,
    seasons: [],
    sourceImage: '',
    sourceUrl: 'https://example.com/clothes-1.jpg',
    state: ClothesStateOptions.done,
    styles: [],
    ...args,
  }) as ClothesResponse;

const createSelectionIndex = (args: Partial<RecommendationSelectionIndexByCategory> = {}): RecommendationSelectionIndexByCategory => ({
  [ClothesCategoryOptions.top]: 0,
  [ClothesCategoryOptions.bottom]: 0,
  [ClothesCategoryOptions.shoes]: 0,
  [ClothesCategoryOptions.accessory]: 0,
  ...args,
});

const createCandidate = (clothesId: string, category: ClothesCategoryOptions): RecommendationSlotCandidate => ({
  category,
  clothes: createRecommendationClothes(clothesId, category),
  clothesId,
  isRecommended: false,
  itemId: '',
  similarity: -1,
});

describe('recommendation.ui', () => {
  test('isDirectImageSourceUrl은 http(s) 이미지 URL만 true를 반환한다', () => {
    expect(isDirectImageSourceUrl('https://cdn.example.com/items/look.JPG?size=120#v')).toBe(true);
    expect(isDirectImageSourceUrl('http://cdn.example.com/items/look.webp')).toBe(true);
    expect(isDirectImageSourceUrl('https://example.com/post/123')).toBe(false);
    expect(isDirectImageSourceUrl('ftp://example.com/look.jpg')).toBe(false);
  });

  test('fetchDefaultRecommendationSeasonsByAnyangWeather는 평균 기온 구간에 맞는 계절을 반환한다', () => {
    expect(fetchDefaultRecommendationSeasonsByAnyangWeather(null)).toEqual([]);
    expect(fetchDefaultRecommendationSeasonsByAnyangWeather(createWeather(23, 23))).toEqual([ClothesSeasonsOptions.summer]);
    expect(fetchDefaultRecommendationSeasonsByAnyangWeather(createWeather(17, 17))).toEqual([ClothesSeasonsOptions.fall]);
    expect(fetchDefaultRecommendationSeasonsByAnyangWeather(createWeather(9, 9))).toEqual([ClothesSeasonsOptions.spring]);
    expect(fetchDefaultRecommendationSeasonsByAnyangWeather(createWeather(0, 8))).toEqual([ClothesSeasonsOptions.winter]);
  });

  test('isClothesProcessingState와 fetchClothesProcessingProgressValue는 상태별 진행률을 일관되게 반환한다', () => {
    expect(isClothesProcessingState(ClothesStateOptions.uploaded)).toBe(true);
    expect(isClothesProcessingState(ClothesStateOptions.preprocessing)).toBe(true);
    expect(isClothesProcessingState(ClothesStateOptions.analyzing)).toBe(true);
    expect(isClothesProcessingState(ClothesStateOptions.embedding)).toBe(true);
    expect(isClothesProcessingState(ClothesStateOptions.done)).toBe(false);

    expect(fetchClothesProcessingProgressValue(ClothesStateOptions.uploaded)).toBe(10);
    expect(fetchClothesProcessingProgressValue(ClothesStateOptions.preprocessing)).toBe(35);
    expect(fetchClothesProcessingProgressValue(ClothesStateOptions.analyzing)).toBe(65);
    expect(fetchClothesProcessingProgressValue(ClothesStateOptions.embedding)).toBe(85);
    expect(fetchClothesProcessingProgressValue(ClothesStateOptions.done)).toBe(100);
  });

  test('buildRecommendationCandidatesByCategory는 추천+옷장 후보를 카테고리별로 합치고 중복을 제거한다', () => {
    const recommendationItems = [
      createRecommendationItem({
        category: ClothesCategoryOptions.top,
        clothes: createRecommendationClothes('top-1', ClothesCategoryOptions.top),
        itemId: 'rec-top-1',
      }),
      createRecommendationItem({
        category: ClothesCategoryOptions.top,
        clothes: createRecommendationClothes('top-1', ClothesCategoryOptions.top),
        itemId: 'rec-top-dup',
      }),
      createRecommendationItem({
        category: ClothesCategoryOptions.shoes,
        clothes: createRecommendationClothes('shoes-1', ClothesCategoryOptions.shoes),
        itemId: 'rec-shoes-1',
      }),
      createRecommendationItem({
        category: '' as ClothesCategoryOptions | '',
        clothes: createRecommendationClothes('invalid-1', ClothesCategoryOptions.top),
        itemId: 'rec-invalid',
      }),
      createRecommendationItem({
        category: ClothesCategoryOptions.accessory,
        clothes: null,
        itemId: 'rec-empty',
      }),
    ];
    const clothesItems = [
      createClothes({
        category: ClothesCategoryOptions.top,
        id: 'top-1',
        state: ClothesStateOptions.done,
      }),
      createClothes({
        category: ClothesCategoryOptions.top,
        id: 'top-2',
        state: ClothesStateOptions.done,
      }),
      createClothes({
        category: ClothesCategoryOptions.top,
        id: 'top-uploading',
        state: ClothesStateOptions.uploaded,
      }),
      createClothes({
        category: ClothesCategoryOptions.accessory,
        id: 'accessory-1',
        state: ClothesStateOptions.done,
      }),
    ];

    const candidates = buildRecommendationCandidatesByCategory(recommendationItems, clothesItems, recommendationSlotCategoryOrder);

    expect(candidates[ClothesCategoryOptions.top].map((item) => item.clothesId)).toEqual(['top-1', 'top-2']);
    expect(candidates[ClothesCategoryOptions.top][0]?.isRecommended).toBe(true);
    expect(candidates[ClothesCategoryOptions.top][1]?.isRecommended).toBe(false);
    expect(candidates[ClothesCategoryOptions.shoes].map((item) => item.clothesId)).toEqual(['shoes-1']);
    expect(candidates[ClothesCategoryOptions.accessory].map((item) => item.clothesId)).toEqual(['accessory-1']);
    expect(candidates[ClothesCategoryOptions.bottom]).toEqual([]);
  });

  test('buildSelectedRecommendationCandidatesByCategory는 선택 인덱스를 후보 범위로 보정한다', () => {
    const candidatesByCategory = {
      [ClothesCategoryOptions.top]: [
        createCandidate('top-1', ClothesCategoryOptions.top),
        createCandidate('top-2', ClothesCategoryOptions.top),
      ],
      [ClothesCategoryOptions.bottom]: [],
      [ClothesCategoryOptions.shoes]: [createCandidate('shoes-1', ClothesCategoryOptions.shoes)],
      [ClothesCategoryOptions.accessory]: [
        createCandidate('accessory-1', ClothesCategoryOptions.accessory),
        createCandidate('accessory-2', ClothesCategoryOptions.accessory),
      ],
    };
    const selectedCandidates = buildSelectedRecommendationCandidatesByCategory(
      candidatesByCategory,
      createSelectionIndex({
        [ClothesCategoryOptions.top]: 5,
        [ClothesCategoryOptions.shoes]: -2,
        [ClothesCategoryOptions.accessory]: 1,
      }),
      recommendationSlotCategoryOrder,
    );

    expect(selectedCandidates[ClothesCategoryOptions.top]?.clothesId).toBe('top-2');
    expect(selectedCandidates[ClothesCategoryOptions.bottom]).toBeNull();
    expect(selectedCandidates[ClothesCategoryOptions.shoes]?.clothesId).toBe('shoes-1');
    expect(selectedCandidates[ClothesCategoryOptions.accessory]?.clothesId).toBe('accessory-2');
  });

  test('fetchRecommendationSelectionPositionLabel은 선택 위치 라벨을 반환한다', () => {
    expect(fetchRecommendationSelectionPositionLabel([], 0)).toBe('0/0');

    const candidates = [
      createCandidate('top-1', ClothesCategoryOptions.top),
      createCandidate('top-2', ClothesCategoryOptions.top),
      createCandidate('top-3', ClothesCategoryOptions.top),
    ];
    expect(fetchRecommendationSelectionPositionLabel(candidates, 0)).toBe('1/3');
    expect(fetchRecommendationSelectionPositionLabel(candidates, 2)).toBe('3/3');
    expect(fetchRecommendationSelectionPositionLabel(candidates, 99)).toBe('3/3');
    expect(fetchRecommendationSelectionPositionLabel(candidates, -3)).toBe('1/3');
  });
});
