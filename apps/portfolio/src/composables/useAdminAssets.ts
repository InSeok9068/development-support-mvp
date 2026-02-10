import pb from '@/api/pocketbase';
import {
  Collections,
  type AdminAssetsResponse,
  type Create,
  type Update,
} from '@/api/pocketbase-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type ComputedRef, type Ref } from 'vue';

type UpdateAdminAssetPayload = {
  adminAssetId: string;
  data: Update<Collections.AdminAssets>;
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
  const isExtractedAssetConnecting = computed(() => connectExtractedAssetMutation.isPending.value);

  const createAdminAssetError = computed(() => createAdminAssetMutation.error.value);
  const updateAdminAssetError = computed(() => updateAdminAssetMutation.error.value);
  const connectExtractedAssetError = computed(() => connectExtractedAssetMutation.error.value);
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchAdminAssetList = () => adminAssetQuery.refetch();

  const createAdminAsset = (
    data: Create<Collections.AdminAssets>,
    onSuccess?: (asset: AdminAssetsResponse) => void,
  ) => {
    createAdminAssetMutation.mutate(data, {
      onSuccess: (asset) => {
        onSuccess?.(asset);
      },
    });
  };

  const updateAdminAsset = (payload: UpdateAdminAssetPayload, onSuccess?: (asset: AdminAssetsResponse) => void) => {
    updateAdminAssetMutation.mutate(payload, {
      onSuccess: (asset) => {
        onSuccess?.(asset);
      },
    });
  };

  const connectExtractedAssetToAdminAsset = (
    payload: ConnectExtractedAssetPayload,
    onSuccess?: () => void,
  ) => {
    connectExtractedAssetMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const createAdminAssetFromExtractedAsset = (
    payload: CreateAdminAssetFromExtractedAssetPayload,
    onSuccess?: (asset: AdminAssetsResponse) => void,
  ) => {
    createAdminAssetMutation.mutate(payload.data, {
      onSuccess: (asset) => {
        connectExtractedAssetMutation.mutate(
          { extractedAssetId: payload.extractedAssetId, adminAssetId: asset.id },
          {
            onSuccess: () => {
              onSuccess?.(asset);
            },
          },
        );
      },
    });
  };
  /* ======================= 메서드 ======================= */

  return {
    adminAssetList,
    adminAssetCount,
    isAdminAssetLoading,
    isAdminAssetFetching,
    isAdminAssetCreating,
    isAdminAssetUpdating,
    isExtractedAssetConnecting,
    createAdminAssetError,
    updateAdminAssetError,
    connectExtractedAssetError,
    fetchAdminAssetList,
    createAdminAsset,
    updateAdminAsset,
    connectExtractedAssetToAdminAsset,
    createAdminAssetFromExtractedAsset,
  };
};
