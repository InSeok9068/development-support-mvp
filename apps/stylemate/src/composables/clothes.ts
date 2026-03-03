import pb from '@/api/pocketbase';
import {
  ClothesCategoryOptions,
  ClothesColorsOptions,
  ClothesContextsOptions,
  ClothesFitOptions,
  ClothesMaterialsOptions,
  ClothesSeasonsOptions,
  ClothesStateOptions,
  ClothesStylesOptions,
  Collections,
  type ClothesResponse,
  type Update,
} from '@/api/pocketbase-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';

export type ClothesFilterParams = {
  categories: ClothesCategoryOptions[];
  colors: ClothesColorsOptions[];
  contexts: ClothesContextsOptions[];
  fit: ClothesFitOptions | 'ALL';
  materials: ClothesMaterialsOptions[];
  seasons: ClothesSeasonsOptions[];
  searchText: string;
  styles: ClothesStylesOptions[];
};

type UpdateClothesArgs = {
  data: Update<Collections.Clothes>;
  id: string;
};

type FetchClothesUrlImageCandidatesResponse = {
  candidates: string[];
  sourceUrl: string;
};

const hasAnyMatchedValue = <T extends string>(source: T[] | null | undefined, target: T[]) => {
  if (!target.length) {
    return true;
  }

  if (!Array.isArray(source) || !source.length) {
    return false;
  }

  return source.some((value) => target.includes(value));
};

export const filterClothesList = (items: ClothesResponse[], params: ClothesFilterParams) => {
  return items.filter((item) => {
    if (params.categories.length) {
      const category = item.category ?? null;
      if (!category || !params.categories.includes(category)) {
        return false;
      }
    }

    if (params.fit !== 'ALL' && item.fit !== params.fit) {
      return false;
    }

    if (!hasAnyMatchedValue(item.seasons, params.seasons)) {
      return false;
    }

    if (!hasAnyMatchedValue(item.colors, params.colors)) {
      return false;
    }

    if (!hasAnyMatchedValue(item.styles, params.styles)) {
      return false;
    }

    if (!hasAnyMatchedValue(item.materials, params.materials)) {
      return false;
    }

    if (!hasAnyMatchedValue(item.contexts, params.contexts)) {
      return false;
    }

    if (params.searchText.trim()) {
      const keyword = params.searchText.trim().toLowerCase();
      const imageHash = String(item.imageHash ?? '').toLowerCase();
      const sourceUrl = String(item.sourceUrl ?? '').toLowerCase();
      if (!imageHash.includes(keyword) && !sourceUrl.includes(keyword)) {
        return false;
      }
    }

    return true;
  });
};

export const useClothes = () => {
  /* ======================= 변수 ======================= */
  const queryClient = useQueryClient();
  const authUserId = computed(() => String(pb.authStore.record?.id ?? ''));
  const queryParams = ref<ClothesFilterParams>({
    categories: [],
    colors: [],
    contexts: [],
    fit: 'ALL',
    materials: [],
    seasons: [],
    searchText: '',
    styles: [],
  });
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const buildQueryKey = (params: ClothesFilterParams) =>
    [
      'clothes',
      'list',
      {
        categories: params.categories,
        colors: params.colors,
        contexts: params.contexts,
        fit: params.fit,
        materials: params.materials,
        seasons: params.seasons,
        searchText: params.searchText,
        styles: params.styles,
      },
    ] as const;
  type ClothesListQueryKey = ReturnType<typeof buildQueryKey>;

  const fetchClothes = (params: ClothesFilterParams) => {
    return pb
      .collection(Collections.Clothes)
      .getFullList({
        sort: '-created',
      })
      .then((items) => filterClothesList(items, params));
  };

  const isProcessingState = (state: ClothesStateOptions | null | undefined) => {
    return (
      state === ClothesStateOptions.uploaded ||
      state === ClothesStateOptions.preprocessing ||
      state === ClothesStateOptions.analyzing ||
      state === ClothesStateOptions.embedding
    );
  };

  const fetchClothesDetail = (id: string) => {
    return pb.collection(Collections.Clothes).getOne(id);
  };

  const clothesQueryKey = computed(() => buildQueryKey(queryParams.value));
  const clothesQuery = useQuery<ClothesResponse[]>({
    placeholderData: (previousData) => previousData,
    refetchInterval: (query) => {
      const items = (query.state.data ?? []) as ClothesResponse[];
      return items.some((item) => isProcessingState(item.state)) ? 2500 : false;
    },
    queryFn: ({ queryKey }) => {
      const [, , params] = queryKey as ClothesListQueryKey;
      return fetchClothes(params);
    },
    queryKey: clothesQueryKey,
  });
  const clothes = computed(() => clothesQuery.data.value ?? []);
  const isClothesLoading = computed(() => clothesQuery.isLoading.value);

  const fetchClothesList = async (params: Partial<ClothesFilterParams> = {}) => {
    const nextParams = {
      ...queryParams.value,
      ...params,
    };

    queryParams.value = nextParams;

    await queryClient.fetchQuery({
      queryFn: () => fetchClothes(nextParams),
      queryKey: buildQueryKey(nextParams),
    });
  };

  const createClothesByFileMutation = useMutation({
    mutationFn: (file: File) =>
      pb.collection(Collections.Clothes).create({
        maxRetry: 3,
        preferenceScore: 0,
        retryCount: 0,
        sourceImage: file,
        sourceType: 'upload',
        state: 'uploaded',
        user: authUserId.value,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clothes'] }),
  });

  const createClothesByUrlMutation = useMutation({
    mutationFn: (sourceUrl: string) =>
      pb.send('/api/clothes/upload-url', {
        body: {
          sourceUrl,
        },
        method: 'POST',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clothes'] }),
  });

  const fetchClothesUrlImageCandidatesMutation = useMutation({
    mutationFn: (sourceUrl: string) =>
      pb.send<FetchClothesUrlImageCandidatesResponse>('/api/clothes/url-image-candidates', {
        body: {
          maxCount: 3,
          sourceUrl,
        },
        method: 'POST',
      }),
  });

  const retryClothesMutation = useMutation({
    mutationFn: (id: string) =>
      pb.send(`/api/clothes/retry/${id}`, {
        method: 'POST',
      }),
    onSuccess: (_result, id) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clothes'] }),
        queryClient.invalidateQueries({ queryKey: ['clothes', 'detail', id] }),
      ]),
  });

  const reembedClothesMutation = useMutation({
    mutationFn: (id: string) =>
      pb.send(`/api/clothes/reembed/${id}`, {
        method: 'POST',
      }),
    onSuccess: (_result, id) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clothes'] }),
        queryClient.invalidateQueries({ queryKey: ['clothes', 'detail', id] }),
      ]),
  });

  const updateClothesMutation = useMutation({
    mutationFn: (args: UpdateClothesArgs) => pb.collection(Collections.Clothes).update(args.id, args.data),
    onSuccess: (_result, args) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clothes'] }),
        queryClient.invalidateQueries({ queryKey: ['clothes', 'detail', args.id] }),
      ]),
  });

  const deleteClothesMutation = useMutation({
    mutationFn: (id: string) =>
      pb.send(`/api/clothes/delete/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: async (_result, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clothes'] }),
        queryClient.invalidateQueries({ queryKey: ['wear-logs'] }),
      ]);
      queryClient.removeQueries({ queryKey: ['clothes', 'detail', id] });
    },
  });

  const createClothesByFile = (file: File) => createClothesByFileMutation.mutateAsync(file);

  const createClothesByUrl = (sourceUrl: string) => createClothesByUrlMutation.mutateAsync(sourceUrl);

  const fetchClothesUrlImageCandidates = async (sourceUrl: string) => {
    const result = await fetchClothesUrlImageCandidatesMutation.mutateAsync(sourceUrl);
    const candidates = (Array.isArray(result?.candidates) ? result.candidates : [])
      .map((item) => String(item ?? '').trim())
      .filter((item) => /^https?:\/\//i.test(item));

    return {
      candidates,
      sourceUrl: String(result?.sourceUrl ?? sourceUrl).trim(),
    };
  };

  const updateClothes = (id: string, data: Update<Collections.Clothes>) => updateClothesMutation.mutateAsync({ data, id });

  const deleteClothes = (id: string) => deleteClothesMutation.mutateAsync(id);

  const updateClothesRetry = (item: ClothesResponse) => {
    return retryClothesMutation.mutateAsync(item.id);
  };

  const updateClothesReembed = (id: string) => {
    return reembedClothesMutation.mutateAsync(id);
  };

  const fetchClothesImageUrl = (item: ClothesResponse) => {
    const fileName = item.sourceImage;
    if (fileName) {
      return pb.files.getURL(item, fileName);
    }

    return String(item.sourceUrl ?? '').trim();
  };

  const isCreatingClothes = computed(() => createClothesByFileMutation.isPending.value || createClothesByUrlMutation.isPending.value);
  const isFetchingClothesUrlImageCandidates = computed(() => fetchClothesUrlImageCandidatesMutation.isPending.value);
  const isUpdatingClothes = computed(
    () => updateClothesMutation.isPending.value || retryClothesMutation.isPending.value || reembedClothesMutation.isPending.value,
  );
  const isDeletingClothes = computed(() => deleteClothesMutation.isPending.value);
  const isReembeddingClothes = computed(() => reembedClothesMutation.isPending.value);
  /* ======================= 메서드 ======================= */

  return {
    clothes,
    isClothesLoading,
    isCreatingClothes,
    isFetchingClothesUrlImageCandidates,
    isUpdatingClothes,
    isDeletingClothes,
    isReembeddingClothes,

    fetchClothesList,
    fetchClothesDetail,
    createClothesByFile,
    createClothesByUrl,
    fetchClothesUrlImageCandidates,
    updateClothes,
    deleteClothes,
    updateClothesRetry,
    updateClothesReembed,
    fetchClothesImageUrl,
  };
};
