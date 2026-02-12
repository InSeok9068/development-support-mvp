import pb from '@/api/pocketbase';
import {
  AdminAssetsCategoryOptions,
  AdminAssetsGroupTypeOptions,
  AdminAssetsSectorsOptions,
  AdminAssetsTagsOptions,
  ExtractedAssetsCategoryOptions,
} from '@/api/pocketbase-types';
import { useMutation } from '@tanstack/vue-query';
import { computed, ref } from 'vue';

type ReportAdminAsset = {
  id: string;
  name: string;
  category: AdminAssetsCategoryOptions;
  groupType: AdminAssetsGroupTypeOptions;
  tags: AdminAssetsTagsOptions[];
  sectors: AdminAssetsSectorsOptions[];
};

type ReportItem = {
  extractedAssetId: string;
  rawName: string;
  category: ExtractedAssetsCategoryOptions;
  amount: number;
  profit: number | null;
  profitRate: number | null;
  quantity: number | null;
  matched: boolean;
  adminAsset: ReportAdminAsset | null;
};

export type CreateReportResponse = {
  reportId: string;
  status: string;
  baseCurrency: string;
  totalValue: number;
  totalProfit: number | null;
  totalProfitRate: number | null;
  items: ReportItem[];
};

export const useReports = () => {
  /* ======================= 변수 ======================= */
  const reportResult = ref<CreateReportResponse | null>(null);
  const createReportMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('baseCurrency', 'KRW');

      return pb.send<CreateReportResponse>('/api/report', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: (data) => {
      reportResult.value = data;
    },
  });
  const isCreatingReport = computed(() => createReportMutation.isPending.value);
  const createReportError = computed(() => createReportMutation.error.value);
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const createReportFromImage = async (file: File) => {
    reportResult.value = null;
    return createReportMutation.mutateAsync(file);
  };
  /* ======================= 메서드 ======================= */

  return {
    reportResult,
    isCreatingReport,
    createReportError,
    createReportFromImage,
  };
};
