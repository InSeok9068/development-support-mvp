import pb from '@/api/pocketbase';
import type { CodesResponse } from '@/api/pocketbase-types';

export const useCode = () => {
  /* ======================= 변수 ======================= */
  let codes = JSON.parse(localStorage.getItem('codes') ?? '{}') as CodesResponse[];
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const initCodes = async () => {
    codes = await pb.collection('codes').getFullList({
      sort: 'type,sort',
    });
    localStorage.removeItem('codes');
    localStorage.setItem('codes', JSON.stringify(codes));
  };

  const getCodesByType = (type: string) => {
    return codes.filter((code) => code.type === type);
  };

  const getCodeDesc = (type: string, value: string) => {
    const code = getCodesByType(type).filter((code) => code.value === value)[0];
    return code ? code.desc : '';
  };

  const getCodeClass = (type: string, value: string) => {
    const code = getCodesByType(type).filter((code) => code.value === value)[0];
    return code ? code.class : '';
  };
  /* ======================= 메서드 ======================= */

  return {
    codes,

    initCodes,
    getCodesByType,
    getCodeDesc,
    getCodeClass,
  };
};
