import pb from '@/api/pocketbase';

type CreateReportResponse = {
  reportId: string;
  status: string;
  gemini: string;
  totalValue?: number;
  items?: Array<{
    name: string;
    amountText: string;
    amountValue: number;
    region: string;
    assetType: string;
    sector?: string;
    style?: string;
    ticker?: string;
    exchange?: string;
    isBondLike?: boolean;
  }>;
};

export const useReports = () => {
  /* ======================= 변수 ======================= */
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const createReportFromImage = (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('provider', 'toss');
    formData.append('baseCurrency', 'KRW');

    return pb.send<CreateReportResponse>('/api/report', {
      method: 'POST',
      body: formData,
    });
  };
  /* ======================= 메서드 ======================= */

  return {
    createReportFromImage,
  };
};
