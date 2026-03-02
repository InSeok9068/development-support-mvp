import pb from '@/api/pocketbase';
import { ClothesCategoryOptions, Collections } from '@/api/pocketbase-types';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

export type WearLogClothesItem = {
  category: ClothesCategoryOptions | null;
  id: string;
  imageUrl: string;
};

export type WearLogItem = {
  created: string;
  id: string;
  itemCount: number;
  items: WearLogClothesItem[];
  note: string;
  wornDate: string;
};

export const useWearLogs = () => {
  /* ======================= 변수 ======================= */
  const queryClient = useQueryClient();
  const wearLogListQueryKey = ['wear-logs', 'list'] as const;
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchWearLogListData = async () => {
    const [wearLogRecords, clothesRecords] = await Promise.all([
      pb.collection(Collections.WearLogs).getFullList({
        sort: '-wornDate,-created',
      }),
      pb.collection(Collections.Clothes).getFullList({
        sort: '-updated',
      }),
    ]);

    const clothesById = new Map(clothesRecords.map((item) => [item.id, item]));

    return wearLogRecords.map<WearLogItem>((wearLog) => {
      const items = (Array.isArray(wearLog.items) ? wearLog.items : []).reduce<WearLogClothesItem[]>((acc, itemId) => {
          const clothes = clothesById.get(itemId);
          if (!clothes) {
            return acc;
          }

          const imageUrl = clothes.sourceImage ? pb.files.getURL(clothes, clothes.sourceImage) : String(clothes.sourceUrl ?? '').trim();
          acc.push({
            category: (clothes.category ?? null) as ClothesCategoryOptions | null,
            id: clothes.id,
            imageUrl,
          });
          return acc;
        }, []);

      return {
        created: wearLog.created,
        id: wearLog.id,
        itemCount: items.length,
        items,
        note: String(wearLog.note ?? '').trim(),
        wornDate: String(wearLog.wornDate ?? ''),
      };
    });
  };

  const wearLogListQuery = useQuery<WearLogItem[]>({
    placeholderData: (previousData) => previousData,
    queryFn: fetchWearLogListData,
    queryKey: wearLogListQueryKey,
  });

  const wearLogList = computed(() => wearLogListQuery.data.value ?? []);
  const isWearLogListLoading = computed(() => wearLogListQuery.isLoading.value);

  const fetchWearLogList = async () => {
    await queryClient.fetchQuery({
      queryFn: fetchWearLogListData,
      queryKey: wearLogListQueryKey,
    });
  };
  /* ======================= 메서드 ======================= */

  return {
    wearLogList,
    isWearLogListLoading,

    fetchWearLogList,
  };
};
