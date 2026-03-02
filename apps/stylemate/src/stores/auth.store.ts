import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore(
  'auth',
  () => {
    const isAuth = ref(false);
    const userId = ref('');

    return {
      isAuth,
      userId,
    };
  },
  {
    persist: true,
  },
);
