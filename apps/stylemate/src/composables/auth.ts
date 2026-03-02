import pb from '@/api/pocketbase';
import { Collections } from '@/api/pocketbase-types';
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

type CreateUserArgs = {
  email: string;
  name: string;
  password: string;
};

export const useAuth = () => {
  /* ======================= 변수 ======================= */
  const router = useRouter();
  const { isAuth, userId } = storeToRefs(useAuthStore());
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const createAuthSession = async (email: string, password: string) => {
    await pb.collection(Collections.Users).authWithPassword(email, password);
    isAuth.value = true;
    userId.value = pb.authStore.record?.id ?? '';
    await router.push('/');
  };

  const createUser = async (args: CreateUserArgs) => {
    await pb.collection(Collections.Users).create({
      email: args.email,
      name: args.name,
      password: args.password,
      passwordConfirm: args.password,
    });
  };

  const deleteAuthSession = async () => {
    pb.authStore.clear();
    isAuth.value = false;
    userId.value = '';
    await router.push('/sign');
  };

  const fetchAuthState = () => {
    isAuth.value = pb.authStore.isValid;
    userId.value = pb.authStore.record?.id ?? '';
    return isAuth.value;
  };

  const fetchAuthUserId = () => pb.authStore.record?.id ?? '';
  /* ======================= 메서드 ======================= */

  return {
    isAuth,
    userId,

    createAuthSession,
    createUser,
    deleteAuthSession,
    fetchAuthState,
    fetchAuthUserId,
  };
};
