import { useAuth } from '@/composables/auth';
import { useRouter } from 'vue-router';

export const useAuthGuard = () => {
  /* ======================= 변수 ======================= */
  const router = useRouter();
  const { fetchAuthState } = useAuth();
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchAuthStateOrRedirect = async () => {
    if (fetchAuthState()) {
      return true;
    }

    await router.push('/sign');
    return false;
  };
  /* ======================= 메서드 ======================= */

  return {
    fetchAuthStateOrRedirect,
  };
};
