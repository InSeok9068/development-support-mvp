import pb from '@/api/pocketbase';
import { Collections, type ExtractedAssetsResponse } from '@/api/pocketbase-types';
import { useQuery } from '@tanstack/vue-query';
import { computed, type ComputedRef, type Ref } from 'vue';

export const useMatchFailures = (enabled: boolean | Ref<boolean> | ComputedRef<boolean> = true) => {
  /* ======================= 변수 ======================= */
  const matchFailureQuery = useQuery({
    queryKey: [Collections.ExtractedAssets, 'unmatched'],
    queryFn: () =>
      pb.collection(Collections.ExtractedAssets).getList<ExtractedAssetsResponse>(1, 50, {
        filter: 'adminAssetId = ""',
        sort: '-created',
      }),
    enabled,
  });

  const matchFailureList = computed(() => matchFailureQuery.data.value?.items ?? []);
  const matchFailureCount = computed(() => matchFailureQuery.data.value?.totalItems ?? 0);
  const isMatchFailureLoading = computed(() => matchFailureQuery.isLoading.value);
  const isMatchFailureFetching = computed(() => matchFailureQuery.isFetching.value);
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchMatchFailureList = () => matchFailureQuery.refetch();
  /* ======================= 메서드 ======================= */

  return {
    matchFailureList,
    matchFailureCount,
    isMatchFailureLoading,
    isMatchFailureFetching,
    fetchMatchFailureList,
  };
};
