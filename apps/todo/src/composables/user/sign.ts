import pb from '@/api/pocketbase';
import { Collections, type Create } from '@/api/pocketbase-types';
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
    await pb.collection(Collections.Users).authWithPassword(email, password);
    isAuth.value = true;
    await router.push('/');
  };

  const signup = async (data: Create<Collections.Users>) => {
    await pb.collection(Collections.Users).create(data);
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
