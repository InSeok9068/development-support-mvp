import pb from '@/api/pocketbase';
import type { Collections, Create, WorksResponse } from '@/api/pocketbase-types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { RecordFullListOptions, RecordListOptions } from 'pocketbase';
import { computed, ref } from 'vue';

type WorkQueryMode = 'full' | 'list';
type WorkQueryParams = {
  mode: WorkQueryMode;
  filter: string;
  sort: string;
  option: RecordFullListOptions | RecordListOptions;
  page: number;
  perPage: number;
};

type UpdateWorkOptions = {
  invalidateWorks?: boolean;
  invalidateWork?: boolean;
};

export const useWork = () => {
  /* ======================= 변수 ======================= */
  const queryClient = useQueryClient();
  const queryParams = ref<WorkQueryParams>({
    mode: 'full',
    filter: 'done = false',
    sort: 'sort,-created',
    option: {},
    page: 1,
    perPage: 20,
  });
  /* ======================= 변수 ======================= */

  /* ======================= 헬퍼 ======================= */
  const buildQueryKey = (params: WorkQueryParams) => [
    'works',
    params.mode,
    {
      filter: params.filter,
      sort: params.sort,
      page: params.page,
      perPage: params.perPage,
      option: params.option,
    },
  ];

  const fetchWorks = async (params: WorkQueryParams) => {
    if (params.mode === 'full') {
      return pb.collection('works').getFullList({
        filter: params.filter,
        sort: params.sort,
        ...(params.option as RecordFullListOptions),
      });
    }

    const list = await pb.collection('works').getList(params.page, params.perPage, {
      filter: params.filter,
      sort: params.sort,
      ...(params.option as RecordListOptions),
    });

    return list.items;
  };
  /* ======================= 헬퍼 ======================= */

  /* ======================= 쿼리 ======================= */
  const worksQueryKey = computed(() => buildQueryKey(queryParams.value));
  const worksQuery = useQuery({
    queryKey: worksQueryKey,
    queryFn: () => fetchWorks(queryParams.value),
    placeholderData: keepPreviousData,
  });
  const works = computed(() => worksQuery.data.value ?? []);
  /* ======================= 쿼리 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchWorkFullList = async ({
    filter = 'done = false',
    sort = 'sort,-created',
    option = {} as RecordFullListOptions,
  } = {}) => {
    const params: WorkQueryParams = {
      mode: 'full',
      filter,
      sort,
      option,
      page: 1,
      perPage: 20,
    };
    queryParams.value = params;
    await queryClient.fetchQuery({
      queryKey: buildQueryKey(params),
      queryFn: () => fetchWorks(params),
    });
  };

  const fetchWorkList = async ({
    filter = 'done = true',
    sort = '-created',
    page = 1,
    perPage = 20,
    option = {} as RecordListOptions,
  } = {}) => {
    const params: WorkQueryParams = {
      mode: 'list',
      filter,
      sort,
      page,
      perPage,
      option,
    };
    queryParams.value = params;
    await queryClient.fetchQuery({
      queryKey: buildQueryKey(params),
      queryFn: () => fetchWorks(params),
    });
  };

  const createWorkMutation = useMutation({
    mutationFn: (payload: Create<Collections.Works>) => pb.collection('works').create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['works'] }),
  });

  const updateWorkMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown> | FormData | Partial<WorksResponse>;
      options?: UpdateWorkOptions;
    }) => pb.collection('works').update(id, data),
    onSuccess: (_result, vars) => {
      const invalidateWorks = vars.options?.invalidateWorks !== false;
      const invalidateWork = vars.options?.invalidateWork !== false;
      if (invalidateWorks) {
        queryClient.invalidateQueries({ queryKey: ['works'] });
      }
      if (invalidateWork) {
        queryClient.invalidateQueries({ queryKey: ['work', vars.id] });
      }
    },
  });

  const deleteWorkMutation = useMutation({
    mutationFn: (id: string) => pb.collection('works').delete(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      queryClient.removeQueries({ queryKey: ['work', id] });
    },
  });

  const createWork = (payload: Create<Collections.Works>) => createWorkMutation.mutateAsync(payload);
  const updateWork = (
    id: string,
    data: Record<string, unknown> | FormData | Partial<WorksResponse>,
    options?: UpdateWorkOptions,
  ) => updateWorkMutation.mutateAsync({ id, data, options });
  const deleteWork = (work: WorksResponse) => deleteWorkMutation.mutateAsync(work.id);

  const setWorksCache = (updater: (current: WorksResponse[]) => WorksResponse[]) => {
    queryClient.setQueryData<WorksResponse[]>(worksQueryKey.value, (current = []) => updater([...current]));
  };
  /* ======================= 메서드 ======================= */

  return {
    works,
    worksQueryKey,
    isFetchingWorks: worksQuery.isFetching,

    fetchWorkFullList,
    fetchWorkList,
    createWork,
    updateWork,
    deleteWork,
    setWorksCache,
  };
};
