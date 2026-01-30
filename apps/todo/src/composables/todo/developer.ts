import pb from '@/api/pocketbase';
import { Collections, type Create, type Update } from '@/api/pocketbase-types';
import { useDeveloperStore } from '@/stores/developer.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { storeToRefs } from 'pinia';
import type { RecordFullListOptions } from 'pocketbase';
import { computed, ref } from 'vue';

export const useDeveloper = () => {
  /* ======================= 변수 ======================= */
  const { selectDeveloper } = storeToRefs(useDeveloperStore());
  const queryClient = useQueryClient();
  const queryParams = ref({
    filter: 'del = false',
    sort: 'sort',
    option: {} as RecordFullListOptions,
  });
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const developersQueryKey = computed(() => [
    'developers',
    {
      filter: queryParams.value.filter,
      sort: queryParams.value.sort,
      option: queryParams.value.option,
    },
  ]);
  const developersQuery = useQuery({
    queryKey: developersQueryKey,
    queryFn: () =>
      pb.collection(Collections.Developers).getFullList({
        filter: queryParams.value.filter,
        sort: queryParams.value.sort,
        ...queryParams.value.option,
      }),
  });
  const developers = computed(() => developersQuery.data.value ?? []);

  const fetchDeveloperList = async ({
    filter = 'del = false',
    sort = 'sort',
    option = {} as RecordFullListOptions,
  } = {}) => {
    queryParams.value = { filter, sort, option };
    await queryClient.fetchQuery({
      queryKey: developersQueryKey.value,
      queryFn: () =>
        pb.collection(Collections.Developers).getFullList({
          filter,
          sort,
          ...option,
        }),
    });
  };

  const createDeveloperMutation = useMutation({
    mutationFn: (payload: Create<Collections.Developers>) => pb.collection(Collections.Developers).create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['developers'] });
    },
  });

  const updateDeveloperMutation = useMutation({
    mutationFn: (payload: Update<Collections.Developers> & { id: string }) =>
      pb.collection(Collections.Developers).update(payload.id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['developers'] });
    },
  });

  const createDeveloper = (payload: Create<Collections.Developers>) => createDeveloperMutation.mutateAsync(payload);

  const updateDeveloper = (payload: Update<Collections.Developers> & { id: string }) =>
    updateDeveloperMutation.mutateAsync(payload);
  /* ======================= 메서드 ======================= */

  return {
    developers,
    selectDeveloper,
    isLoading: developersQuery.isLoading,

    fetchDeveloperList,
    createDeveloper,
    updateDeveloper,
  };
};
