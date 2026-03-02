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
  items: RecommendationItem[];
  round: number;
  sessionId: string;
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
};

type CreateRecommendationConfirmArgs = {
  note: string;
  selectedClothesIds?: string[];
  selectedItemIds?: string[];
  wornDate: string;
};

type RecommendationCategory =
  | ClothesCategoryOptions.top
  | ClothesCategoryOptions.bottom
  | ClothesCategoryOptions.shoes
  | ClothesCategoryOptions.accessory;

export type RecommendationPinnedByCategory = Partial<Record<RecommendationCategory, string>>;

export const useRecommendations = () => {
  /* ======================= 변수 ======================= */
  const queryClient = useQueryClient();
  const recommendationItems = ref<RecommendationItem[]>([]);
  const recommendationSessionId = ref('');
  const recommendationRound = ref(0);
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const createRecommendationSessionMutation = useMutation({
    mutationFn: (args: CreateRecommendationSessionArgs) =>
      pb.send<CreateRecommendationSessionResponse>('/api/recommendations/request', {
        body: {
          queryText: args.queryText,
          seasons: args.seasons,
        },
        method: 'POST',
      }),
  });

  const updateRecommendationRerollMutation = useMutation({
    mutationFn: (pinnedByCategory: RecommendationPinnedByCategory) =>
      pb.send<UpdateRecommendationRerollResponse>('/api/recommendations/reroll', {
        body: {
          pinnedByCategory,
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
          selectedClothesIds: Array.isArray(args.selectedClothesIds) ? args.selectedClothesIds : [],
          selectedItemIds: Array.isArray(args.selectedItemIds) ? args.selectedItemIds : [],
          sessionId: recommendationSessionId.value,
          wornDate: args.wornDate,
        },
        method: 'POST',
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clothes'] }),
        queryClient.invalidateQueries({ queryKey: ['wear-logs'] }),
      ]),
  });

  const createRecommendationSession = async (args: CreateRecommendationSessionArgs) => {
    const result = await createRecommendationSessionMutation.mutateAsync(args);
    recommendationSessionId.value = result.sessionId;
    recommendationRound.value = result.round;
    recommendationItems.value = result.items;
    return result;
  };

  const updateRecommendationReroll = async (pinnedByCategory: RecommendationPinnedByCategory = {}) => {
    const result = await updateRecommendationRerollMutation.mutateAsync(pinnedByCategory);
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
    isCreatingRecommendationSession,
    isUpdatingRecommendationReroll,
    isCreatingRecommendationConfirm,
    isRecommendationPending,

    createRecommendationSession,
    updateRecommendationReroll,
    createRecommendationConfirm,
    resetRecommendationSession,
  };
};
