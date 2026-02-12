import pb from '@/api/pocketbase';
import { Collections, type AdminAssetsResponse, type Create, type Update } from '@/api/pocketbase-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type ComputedRef, type Ref } from 'vue';

type UpdateAdminAssetPayload = {
  adminAssetId: string;
  data: Update<Collections.AdminAssets>;
};

type DeleteAdminAssetPayload = {
  adminAssetId: string;
};

type ConnectExtractedAssetPayload = {
  extractedAssetId: string;
  adminAssetId: string;
};

type CreateAdminAssetFromExtractedAssetPayload = {
  extractedAssetId: string;
  data: Create<Collections.AdminAssets>;
};

export const useAdminAssets = (enabled: boolean | Ref<boolean> | ComputedRef<boolean> = true) => {
  /* ======================= 변수 ======================= */
  const queryClient = useQueryClient();
  const adminAssetQuery = useQuery({
    queryKey: [Collections.AdminAssets, 'list'],
    queryFn: () =>
      pb.collection(Collections.AdminAssets).getFullList<AdminAssetsResponse>({
        sort: 'name',
      }),
    enabled,
  });
  const createAdminAssetMutation = useMutation({
    mutationFn: (data: Create<Collections.AdminAssets>) =>
      pb.collection(Collections.AdminAssets).create<AdminAssetsResponse>(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [Collections.AdminAssets, 'list'],
      });
    },
  });
  const updateAdminAssetMutation = useMutation({
    mutationFn: ({ adminAssetId, data }: UpdateAdminAssetPayload) =>
      pb.collection(Collections.AdminAssets).update<AdminAssetsResponse>(adminAssetId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [Collections.AdminAssets, 'list'],
      });
    },
  });
  const deleteAdminAssetMutation = useMutation({
    mutationFn: async ({ adminAssetId }: DeleteAdminAssetPayload) => {
      const extractedAssets = await pb.collection(Collections.ExtractedAssets).getFullList({
        filter: `adminAssetId = "${adminAssetId}"`,
      });
      if (extractedAssets.length) {
        await Promise.all(
          extractedAssets.map((item) => {
            return pb.collection(Collections.ExtractedAssets).update(item.id, { adminAssetId: '' });
          }),
        );
      }

      const matchLogs = await pb.collection(Collections.MatchLogs).getFullList({
        filter: `adminAssetId = "${adminAssetId}"`,
      });
      if (matchLogs.length) {
        await Promise.all(
          matchLogs.map((item) => {
            return pb.collection(Collections.MatchLogs).update(item.id, { adminAssetId: '' });
          }),
        );
      }

      await pb.collection(Collections.AdminAssets).delete(adminAssetId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [Collections.AdminAssets, 'list'],
      });
      await queryClient.invalidateQueries({
        queryKey: [Collections.ExtractedAssets, 'unmatched'],
      });
    },
  });
  const connectExtractedAssetMutation = useMutation({
    mutationFn: ({ extractedAssetId, adminAssetId }: ConnectExtractedAssetPayload) =>
      pb.collection(Collections.ExtractedAssets).update(extractedAssetId, { adminAssetId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [Collections.ExtractedAssets, 'unmatched'],
      });
    },
  });

  const adminAssetList = computed(() => adminAssetQuery.data.value ?? []);
  const adminAssetCount = computed(() => adminAssetList.value.length);
  const isAdminAssetLoading = computed(() => adminAssetQuery.isLoading.value);
  const isAdminAssetFetching = computed(() => adminAssetQuery.isFetching.value);
  const isAdminAssetCreating = computed(() => createAdminAssetMutation.isPending.value);
  const isAdminAssetUpdating = computed(() => updateAdminAssetMutation.isPending.value);
  const isAdminAssetDeleting = computed(() => deleteAdminAssetMutation.isPending.value);
  const isExtractedAssetConnecting = computed(() => connectExtractedAssetMutation.isPending.value);

  const createAdminAssetError = computed(() => createAdminAssetMutation.error.value);
  const updateAdminAssetError = computed(() => updateAdminAssetMutation.error.value);
  const deleteAdminAssetError = computed(() => deleteAdminAssetMutation.error.value);
  const connectExtractedAssetError = computed(() => connectExtractedAssetMutation.error.value);
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchAdminAssetList = () => adminAssetQuery.refetch();

  const createAdminAsset = (data: Create<Collections.AdminAssets>) => createAdminAssetMutation.mutateAsync(data);

  const updateAdminAsset = (payload: UpdateAdminAssetPayload) => updateAdminAssetMutation.mutateAsync(payload);

  const deleteAdminAsset = (payload: DeleteAdminAssetPayload) => deleteAdminAssetMutation.mutateAsync(payload);

  const connectExtractedAssetToAdminAsset = (payload: ConnectExtractedAssetPayload) =>
    connectExtractedAssetMutation.mutateAsync(payload);

  const createAdminAssetFromExtractedAsset = async (payload: CreateAdminAssetFromExtractedAssetPayload) => {
    const createdAsset = await createAdminAssetMutation.mutateAsync(payload.data);
    await connectExtractedAssetMutation.mutateAsync({
      extractedAssetId: payload.extractedAssetId,
      adminAssetId: createdAsset.id,
    });
    return createdAsset;
  };
  /* ======================= 메서드 ======================= */

  return {
    adminAssetList,
    adminAssetCount,
    isAdminAssetLoading,
    isAdminAssetFetching,
    isAdminAssetCreating,
    isAdminAssetUpdating,
    isAdminAssetDeleting,
    isExtractedAssetConnecting,
    createAdminAssetError,
    updateAdminAssetError,
    deleteAdminAssetError,
    connectExtractedAssetError,
    fetchAdminAssetList,
    createAdminAsset,
    updateAdminAsset,
    deleteAdminAsset,
    connectExtractedAssetToAdminAsset,
    createAdminAssetFromExtractedAsset,
  };
};
