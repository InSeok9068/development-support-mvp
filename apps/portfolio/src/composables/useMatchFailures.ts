import pb from '@/api/pocketbase';
import { Collections, type ExtractedAssetsResponse } from '@/api/pocketbase-types';
import { useQuery } from '@tanstack/vue-query';
import { computed, type ComputedRef, type Ref } from 'vue';

type MatchFailureDateFilter = {
  fromDate: Ref<string>;
  toDate: Ref<string>;
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
  const matchFailureQueryKey = computed(() => [Collections.ExtractedAssets, 'unmatched', fromDate.value, toDate.value]);
  const pocketbaseFilter = computed(() => buildMatchFailureFilter(fromDate.value, toDate.value));

  const matchFailureQuery = useQuery({
    queryKey: matchFailureQueryKey,
    queryFn: () =>
      pb.collection(Collections.ExtractedAssets).getList<ExtractedAssetsResponse>(1, 50, {
        filter: pocketbaseFilter.value,
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
