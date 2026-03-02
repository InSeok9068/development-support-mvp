import pb from '@/api/pocketbase';
import {
  type ClothesCategoryOptions,
  type ClothesColorsOptions,
  type ClothesContextsOptions,
  type ClothesFitOptions,
  type ClothesMaterialsOptions,
  type ClothesSeasonsOptions,
  type ClothesStylesOptions,
} from '@/api/pocketbase-types';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';

type RecommendationFilter = {
  categories: ClothesCategoryOptions[];
  colors: ClothesColorsOptions[];
  contexts: ClothesContextsOptions[];
  fit: ClothesFitOptions | '';
  materials: ClothesMaterialsOptions[];
  seasons: ClothesSeasonsOptions[];
  styles: ClothesStylesOptions[];
};

type RecommendationClothes = {
  category: ClothesCategoryOptions | '';
  colors: ClothesColorsOptions[];
  contexts: ClothesContextsOptions[];
  fit: ClothesFitOptions | '';
  id: string;
  imageHash: string;
  materials: ClothesMaterialsOptions[];
  preferenceScore: number;
  seasons: ClothesSeasonsOptions[];
  sourceImage: string;
  sourceUrl: string;
  styles: ClothesStylesOptions[];
};

export type RecommendationItem = {
  category: ClothesCategoryOptions | '';
  clothes: RecommendationClothes | null;
  isPinned: boolean;
  itemId: string;
  rank: number;
  round: number;
  similarity: number;
};

type CreateRecommendationSessionResponse = {
  embeddingModel: string;
  filterModel: string;
  items: RecommendationItem[];
  queryFilter: RecommendationFilter;
  round: number;
  sessionId: string;
  topK: number;
};

type UpdateRecommendationRerollResponse = {
  items: RecommendationItem[];
  round: number;
  sessionId: string;
};

type CreateRecommendationConfirmResponse = {
  selectedCount: number;
  sessionId: string;
  wearLogId: string;
  wornDate: string;
};

type CreateRecommendationSessionArgs = {
  queryText: string;
  seasons: ClothesSeasonsOptions[];
  topK: number;
};

type CreateRecommendationConfirmArgs = {
  note: string;
  wornDate: string;
};

export const useRecommendations = () => {
  /* ======================= 변수 ======================= */
  const queryClient = useQueryClient();
  const recommendationItems = ref<RecommendationItem[]>([]);
  const recommendationSessionId = ref('');
  const recommendationRound = ref(0);
  const recommendationTopK = ref(12);
  const recommendationQueryFilter = ref<RecommendationFilter | null>(null);
  const recommendationEmbeddingModel = ref('');
  const recommendationFilterModel = ref('');
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const createRecommendationSessionMutation = useMutation({
    mutationFn: (args: CreateRecommendationSessionArgs) =>
      pb.send<CreateRecommendationSessionResponse>('/api/recommendations/request', {
        body: {
          queryText: args.queryText,
          seasons: args.seasons,
          topK: args.topK,
        },
        method: 'POST',
      }),
  });

  const updateRecommendationRerollMutation = useMutation({
    mutationFn: (pinnedItemIds: string[]) =>
      pb.send<UpdateRecommendationRerollResponse>('/api/recommendations/reroll', {
        body: {
          pinnedItemIds,
          sessionId: recommendationSessionId.value,
        },
        method: 'POST',
      }),
  });

  const createRecommendationConfirmMutation = useMutation({
    mutationFn: (args: CreateRecommendationConfirmArgs) =>
      pb.send<CreateRecommendationConfirmResponse>('/api/recommendations/confirm', {
        body: {
          note: args.note,
          selectedItemIds: recommendationItems.value.map((item) => item.itemId),
          sessionId: recommendationSessionId.value,
          wornDate: args.wornDate,
        },
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothes'] });
      queryClient.invalidateQueries({ queryKey: ['wear-logs'] });
    },
  });

  const createRecommendationSession = async (args: CreateRecommendationSessionArgs) => {
    const result = await createRecommendationSessionMutation.mutateAsync(args);
    recommendationSessionId.value = result.sessionId;
    recommendationRound.value = result.round;
    recommendationTopK.value = result.topK;
    recommendationItems.value = result.items;
    recommendationQueryFilter.value = result.queryFilter;
    recommendationEmbeddingModel.value = result.embeddingModel;
    recommendationFilterModel.value = result.filterModel;
    return result;
  };

  const updateRecommendationItemPinned = (itemId: string, isPinned: boolean) => {
    recommendationItems.value = recommendationItems.value.map((item) => {
      if (item.itemId !== itemId) {
        return item;
      }

      return {
        ...item,
        isPinned,
      };
    });
  };

  const updateRecommendationReroll = async () => {
    const pinnedItemIds = recommendationItems.value.filter((item) => item.isPinned).map((item) => item.itemId);
    const result = await updateRecommendationRerollMutation.mutateAsync(pinnedItemIds);
    recommendationSessionId.value = result.sessionId;
    recommendationRound.value = result.round;
    recommendationItems.value = result.items;
    return result;
  };

  const createRecommendationConfirm = (args: CreateRecommendationConfirmArgs) => {
    return createRecommendationConfirmMutation.mutateAsync(args);
  };

  const resetRecommendationSession = () => {
    recommendationItems.value = [];
    recommendationSessionId.value = '';
    recommendationRound.value = 0;
    recommendationTopK.value = 12;
    recommendationQueryFilter.value = null;
    recommendationEmbeddingModel.value = '';
    recommendationFilterModel.value = '';
  };

  const isCreatingRecommendationSession = computed(() => createRecommendationSessionMutation.isPending.value);
  const isUpdatingRecommendationReroll = computed(() => updateRecommendationRerollMutation.isPending.value);
  const isCreatingRecommendationConfirm = computed(() => createRecommendationConfirmMutation.isPending.value);
  const isRecommendationPending = computed(
    () => isCreatingRecommendationSession.value || isUpdatingRecommendationReroll.value || isCreatingRecommendationConfirm.value,
  );
  /* ======================= 메서드 ======================= */

  return {
    recommendationItems,
    recommendationSessionId,
    recommendationRound,
    recommendationTopK,
    recommendationQueryFilter,
    recommendationEmbeddingModel,
    recommendationFilterModel,
    isCreatingRecommendationSession,
    isUpdatingRecommendationReroll,
    isCreatingRecommendationConfirm,
    isRecommendationPending,

    createRecommendationSession,
    updateRecommendationItemPinned,
    updateRecommendationReroll,
    createRecommendationConfirm,
    resetRecommendationSession,
  };
};
