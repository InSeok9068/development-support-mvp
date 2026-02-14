import pb from '@/api/pocketbase';
import {
  AdminAssetsCategoryOptions,
  AdminAssetsGroupTypeOptions,
  AdminAssetsSectorsOptions,
  AdminAssetsTagsOptions,
  Collections,
  ExtractedAssetsCategoryOptions,
  type ExtractedAssetsResponse,
} from '@/api/pocketbase-types';
import { useMutation, useQuery } from '@tanstack/vue-query';
import { computed, type ComputedRef, type Ref } from 'vue';

type MatchFailureDateFilter = {
  fromDate: Ref<string>;
  toDate: Ref<string>;
};

type FetchMatchFailureAiSuggestionPayload = {
  rawName: string;
  category: ExtractedAssetsCategoryOptions;
};

type MatchFailureAiSuggestionResponse = {
  category: AdminAssetsCategoryOptions;
  groupType: AdminAssetsGroupTypeOptions;
  tags: AdminAssetsTagsOptions[];
  sectors: AdminAssetsSectorsOptions[];
};

const buildDateTimeBoundary = (date: string, boundary: 'start' | 'end') => {
  return boundary === 'start' ? `${date} 00:00:00` : `${date} 23:59:59`;
};

const buildMatchFailureFilter = (fromDate: string, toDate: string) => {
  const conditions = ['adminAssetId = ""'];
  if (fromDate) {
    conditions.push(`created >= '${buildDateTimeBoundary(fromDate, 'start')}'`);
  }
  if (toDate) {
    conditions.push(`created <= '${buildDateTimeBoundary(toDate, 'end')}'`);
  }
  return conditions.join(' && ');
};

export const useMatchFailures = (
  enabled: boolean | Ref<boolean> | ComputedRef<boolean> = true,
  dateFilter?: MatchFailureDateFilter,
) => {
  /* ======================= 변수 ======================= */
  const fromDate = computed(() => dateFilter?.fromDate.value ?? '');
  const toDate = computed(() => dateFilter?.toDate.value ?? '');
  const buildMatchFailureQueryKey = (params: { fromDate: string; toDate: string }) =>
    [
      'extracted-assets',
      'unmatched',
      {
        fromDate: params.fromDate,
        toDate: params.toDate,
      },
    ] as const;
  type MatchFailureQueryKey = ReturnType<typeof buildMatchFailureQueryKey>;
  const matchFailureQueryKey = computed(() =>
    buildMatchFailureQueryKey({
      fromDate: fromDate.value,
      toDate: toDate.value,
    }),
  );

  const matchFailureQuery = useQuery({
    queryKey: matchFailureQueryKey,
    queryFn: ({ queryKey }) => {
      const [, , params] = queryKey as MatchFailureQueryKey;
      return pb.collection(Collections.ExtractedAssets).getFullList<ExtractedAssetsResponse>({
        filter: buildMatchFailureFilter(params.fromDate, params.toDate),
        sort: '-created',
      });
    },
    enabled,
  });
  const matchFailureAiSuggestionMutation = useMutation({
    mutationFn: (payload: FetchMatchFailureAiSuggestionPayload) =>
      pb.send<MatchFailureAiSuggestionResponse>('/api/match-failure/suggest', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'content-type': 'application/json',
        },
      }),
  });

  const matchFailureList = computed(() => matchFailureQuery.data.value ?? []);
  const matchFailureCount = computed(() => matchFailureList.value.length);
  const isMatchFailureLoading = computed(() => matchFailureQuery.isLoading.value);
  const isMatchFailureFetching = computed(() => matchFailureQuery.isFetching.value);
  const isMatchFailureAiSuggesting = computed(() => matchFailureAiSuggestionMutation.isPending.value);
  const matchFailureAiSuggestionError = computed(() => matchFailureAiSuggestionMutation.error.value);
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchMatchFailureList = () => matchFailureQuery.refetch();
  const fetchMatchFailureAiSuggestion = (payload: FetchMatchFailureAiSuggestionPayload) =>
    matchFailureAiSuggestionMutation.mutateAsync(payload);
  /* ======================= 메서드 ======================= */

  return {
    matchFailureList,
    matchFailureCount,
    isMatchFailureLoading,
    isMatchFailureFetching,
    isMatchFailureAiSuggesting,
    matchFailureAiSuggestionError,
    fetchMatchFailureList,
    fetchMatchFailureAiSuggestion,
  };
};
