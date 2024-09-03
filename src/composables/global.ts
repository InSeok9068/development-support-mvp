import { useGlobalStore } from '@/stores/global.store';
import { storeToRefs } from 'pinia';

export const useGlobal = () => {
  /* ======================= 변수 ======================= */
  const { global } = storeToRefs(useGlobalStore());
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const toggleTheme = () => {
    global.value.theme = global.value.theme === 'white' ? 'dark' : 'white';
    document.documentElement.setAttribute('data-theme', global.value.theme);
  };

  const initTheme = () => {
    document.documentElement.setAttribute('data-theme', global.value.theme);
  };
  /* ======================= 메서드 ======================= */

  return {
    global,

    toggleTheme,
    initTheme,
  };
};
