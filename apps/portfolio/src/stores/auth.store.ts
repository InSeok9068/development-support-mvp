import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore(
  'auth',
  () => {
    const isAuth = ref(false);
    const isSuperuser = ref(false);
    const authEmail = ref('');

    return { isAuth, isSuperuser, authEmail };
  },
  { persist: true },
);
