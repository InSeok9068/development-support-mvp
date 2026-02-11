import { useGlobalStore } from '@/stores/global.store';
import { storeToRefs } from 'pinia';

export const useGlobal = () => {
  /* ======================= 변수 ======================= */
  const { global } = storeToRefs(useGlobalStore());
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 메서드 ======================= */
  const applyThemeClass = () => {
    if (global.value.theme === 'dark') {
      document.documentElement.classList.add('sl-theme-dark');
      document.documentElement.classList.remove('sl-theme-light');
      return;
    }
    document.documentElement.classList.add('sl-theme-light');
    document.documentElement.classList.remove('sl-theme-dark');
  };

  const toggleTheme = () => {
    global.value.theme = global.value.theme === 'white' ? 'dark' : 'white';
    applyThemeClass();
  };

  const initTheme = () => {
    const hasSavedTheme = localStorage.getItem('global');
    if (!hasSavedTheme) {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      global.value.theme = isSystemDark ? 'dark' : 'white';
    }
    applyThemeClass();
  };
  /* ======================= 메서드 ======================= */

  return {
    global,

    toggleTheme,
    initTheme,
  };
};
