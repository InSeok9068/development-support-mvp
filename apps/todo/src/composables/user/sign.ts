import pb from '@/api/pocketbase';
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

export const useSign = () => {
  /* ======================= 변수 ======================= */
  const router = useRouter();
  const { isAuth } = storeToRefs(useAuthStore());
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const signout = async () => {
    pb.authStore.clear();
    isAuth.value = false;
    await router.push('/sign');
  };
  /* ======================= 메서드 ======================= */

  return {
    isAuth,

    signout,
  };
};
