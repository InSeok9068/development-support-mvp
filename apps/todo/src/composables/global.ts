import { useGlobalStore } from '@/stores/global.store';
import { storeToRefs } from 'pinia';

export const useGlobal = () => {
  /* ======================= 변수 ======================= */
  const { global } = storeToRefs(useGlobalStore());
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 메서드 ======================= */
  const toggleTheme = () => {
    global.value.theme = global.value.theme === 'white' ? 'dark' : 'white';
    if (global.value.theme === 'dark') {
      document.documentElement.classList.add('sl-theme-dark');
    } else {
      document.documentElement.classList.remove('sl-theme-dark');
    }
  };

  const initTheme = () => {
    if (global.value.theme === 'dark') {
      document.documentElement.classList.add('sl-theme-dark');
    } else {
      document.documentElement.classList.remove('sl-theme-dark');
    }
  };
  /* ======================= 메서드 ======================= */

  return {
    global,

    toggleTheme,
    initTheme,
  };
};
