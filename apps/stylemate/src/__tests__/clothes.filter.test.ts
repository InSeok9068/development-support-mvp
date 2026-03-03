import {
  ClothesCategoryOptions,
  ClothesColorsOptions,
  ClothesContextsOptions,
  ClothesFitOptions,
  ClothesMaterialsOptions,
  ClothesSeasonsOptions,
  ClothesStylesOptions,
  type ClothesResponse,
} from '@/api/pocketbase-types';
import { filterClothesList, type ClothesFilterParams } from '@/composables/clothes';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/api/pocketbase', () => ({
  default: {
    authStore: {
      record: null,
    },
    collection: vi.fn(),
    files: {
      getURL: vi.fn(),
    },
    send: vi.fn(),
  },
}));

const createFilterParams = (args: Partial<ClothesFilterParams> = {}): ClothesFilterParams => ({
  categories: [],
  colors: [],
  contexts: [],
  fit: 'ALL',
  materials: [],
  seasons: [],
  searchText: '',
  styles: [],
  ...args,
});

const createClothes = (args: Partial<ClothesResponse> = {}): ClothesResponse =>
  ({
    category: ClothesCategoryOptions.top,
    colors: [ClothesColorsOptions.black],
    contexts: [ClothesContextsOptions.daily],
    fit: ClothesFitOptions.regular,
    id: 'clothes-1',
    imageHash: 'hash-1',
    materials: [ClothesMaterialsOptions.cotton],
    preferenceScore: 0,
    seasons: [ClothesSeasonsOptions.spring],
    sourceUrl: 'https://example.com/top-1.jpg',
    styles: [ClothesStylesOptions.casual],
    ...args,
  }) as ClothesResponse;

describe('filterClothesList', () => {
  test('필터가 없으면 전체 목록을 반환한다', () => {
    const items = [
      createClothes({ category: ClothesCategoryOptions.top, id: 'top-1' }),
      createClothes({ category: ClothesCategoryOptions.bottom, id: 'bottom-1' }),
    ];

    const result = filterClothesList(items, createFilterParams());

    expect(result.map((item) => item.id)).toEqual(['top-1', 'bottom-1']);
  });

  test('카테고리, 핏, 메타 필터가 모두 일치하는 항목만 남긴다', () => {
    const items = [
      createClothes({
        category: ClothesCategoryOptions.top,
        colors: [ClothesColorsOptions.black, ClothesColorsOptions.white],
        contexts: [ClothesContextsOptions.daily, ClothesContextsOptions.work],
        fit: ClothesFitOptions.regular,
        id: 'target',
        materials: [ClothesMaterialsOptions.cotton],
        seasons: [ClothesSeasonsOptions.spring],
        styles: [ClothesStylesOptions.casual],
      }),
      createClothes({
        category: ClothesCategoryOptions.top,
        colors: [ClothesColorsOptions.red],
        contexts: [ClothesContextsOptions.party],
        fit: ClothesFitOptions.slim,
        id: 'non-target',
        materials: [ClothesMaterialsOptions.denim],
        seasons: [ClothesSeasonsOptions.winter],
        styles: [ClothesStylesOptions.formal],
      }),
    ];
    const params = createFilterParams({
      categories: [ClothesCategoryOptions.top],
      colors: [ClothesColorsOptions.white],
      contexts: [ClothesContextsOptions.work],
      fit: ClothesFitOptions.regular,
      materials: [ClothesMaterialsOptions.cotton],
      seasons: [ClothesSeasonsOptions.spring],
      styles: [ClothesStylesOptions.casual],
    });

    const result = filterClothesList(items, params);

    expect(result.map((item) => item.id)).toEqual(['target']);
  });

  test('searchText는 imageHash/sourceUrl을 대소문자 무시하고 검색한다', () => {
    const items = [
      createClothes({
        id: 'hash-match',
        imageHash: 'ABC123HASH',
        sourceUrl: 'https://example.com/one.jpg',
      }),
      createClothes({
        id: 'url-match',
        imageHash: 'other-hash',
        sourceUrl: 'https://cdn.example.com/LookBook/Two.JPG',
      }),
      createClothes({
        id: 'miss',
        imageHash: 'miss-hash',
        sourceUrl: 'https://example.com/three.jpg',
      }),
    ];

    const byHash = filterClothesList(items, createFilterParams({ searchText: 'abc123' }));
    const byUrl = filterClothesList(items, createFilterParams({ searchText: 'lookbook/two' }));

    expect(byHash.map((item) => item.id)).toEqual(['hash-match']);
    expect(byUrl.map((item) => item.id)).toEqual(['url-match']);
  });

  test('target 값이 있는데 source 배열이 비어 있으면 제외한다', () => {
    const items = [
      createClothes({
        id: 'no-seasons',
        seasons: [],
      }),
      createClothes({
        id: 'with-seasons',
        seasons: [ClothesSeasonsOptions.winter],
      }),
    ];

    const result = filterClothesList(
      items,
      createFilterParams({
        seasons: [ClothesSeasonsOptions.winter],
      }),
    );

    expect(result.map((item) => item.id)).toEqual(['with-seasons']);
  });

  test('fit이 ALL이면 fit 기준을 적용하지 않는다', () => {
    const items = [
      createClothes({ fit: ClothesFitOptions.slim, id: 'slim-fit' }),
      createClothes({ fit: ClothesFitOptions.oversized, id: 'oversized-fit' }),
    ];

    const result = filterClothesList(items, createFilterParams({ fit: 'ALL' }));

    expect(result.map((item) => item.id)).toEqual(['slim-fit', 'oversized-fit']);
  });
});
