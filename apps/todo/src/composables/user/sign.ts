import pb from '@/api/pocketbase';
import type { Create } from '@/api/pocketbase-types';
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

export const useSign = () => {
  /* ======================= 변수 ======================= */
  const router = useRouter();
  const { isAuth } = storeToRefs(useAuthStore());
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const signin = async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email, password);
    isAuth.value = true;
    await router.push('/');
  };

  const signup = async (data: Create<'users'>) => {
    await pb.collection('users').create(data);
  };

  const signout = async () => {
    pb.authStore.clear();
    isAuth.value = false;
    await router.push('/sign');
  };

  const getUserId = () => pb.authStore.record?.id ?? '';

  const checkAuth = () => {
    isAuth.value = pb.authStore.isValid;
    return isAuth.value;
  };
  /* ======================= 메서드 ======================= */

  return {
    isAuth,

    signin,
    signup,
    signout,
    getUserId,
    checkAuth,
  };
};
