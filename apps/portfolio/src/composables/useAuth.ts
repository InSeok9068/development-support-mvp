import pb from '@/api/pocketbase';
import { Collections, type Create } from '@/api/pocketbase-types';
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';

export const useAuth = () => {
  /* ======================= 변수 ======================= */
  const { isAuth, isSuperuser, authEmail } = storeToRefs(useAuthStore());
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchAuthState = () => {
    isAuth.value = pb.authStore.isValid;
    const collectionName = pb.authStore.model?.collectionName ?? '';
    isSuperuser.value = collectionName === Collections.Superusers;
    authEmail.value = pb.authStore.model?.email ?? '';
    return isAuth.value;
  };

  const createAuthSession = async (email: string, password: string) => {
    await pb.collection(Collections.Superusers).authWithPassword(email, password);
    fetchAuthState();
  };

  const createUserAccount = async (data: Create<Collections.Users>) => {
    await pb.collection(Collections.Users).create(data);
  };

  const deleteAuthSession = async () => {
    pb.authStore.clear();
    fetchAuthState();
  };
  /* ======================= 메서드 ======================= */

  return {
    isAuth,
    isSuperuser,
    authEmail,

    fetchAuthState,
    createAuthSession,
    createUserAccount,
    deleteAuthSession,
  };
};
