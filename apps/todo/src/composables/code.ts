import pb from '@/api/pocketbase';
import { Collections, type CodesResponse } from '@/api/pocketbase-types';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

export const useCode = () => {
  /* ======================= 변수 ======================= */
  const queryClient = useQueryClient();
  const codesQuery = useQuery({
    queryKey: ['codes'],
    queryFn: async () => {
      const result = await pb.collection(Collections.Codes).getFullList({
        sort: 'type,sort',
      });
      localStorage.setItem('codes', JSON.stringify(result));
      return result;
    },
    initialData: () => {
      const cached = localStorage.getItem('codes');
      return cached ? (JSON.parse(cached) as CodesResponse[]) : [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const codes = computed(() => codesQuery.data.value ?? []);
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchCodeList = async () => {
    await queryClient.invalidateQueries({ queryKey: ['codes'] });
  };

  const getCodesByType = (type: string) => {
    return codes.value.filter((code: CodesResponse) => code.type === type);
  };

  const getCodeDesc = (type: string, value: string) => {
    const code = getCodesByType(type).find((code: CodesResponse) => code.value === value);
    return code ? code.desc : '';
  };

  const getCodeClass = (type: string, value: string) => {
    const code = getCodesByType(type).find((code: CodesResponse) => code.value === value);
    return code ? code.class : '';
  };
  /* ======================= 메서드 ======================= */

  return {
    codes,

    fetchCodeList,
    getCodesByType,
    getCodeDesc,
    getCodeClass,
  };
};
