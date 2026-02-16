import { computed, ref } from 'vue';

import pb from '@/api/pocketbase';
import { Collections, type SuperusersResponse } from '@/api/pocketbase-types';

type SignInPayload = {
  loginId: string;
  password: string;
};

const KJCA_EMAIL_DOMAIN = 'kjca.local';

const normalizeSuperuserLoginId = (loginId: string) => {
  const id = String(loginId ?? '').trim();
  if (!id) return '';
  if (id.includes('@')) return id;
  return `${id}@${KJCA_EMAIL_DOMAIN}`;
};

const readSuperuserRecord = () => {
  const authRecord = pb.authStore.record as SuperusersResponse | null;
  if (!authRecord) return null;
  return authRecord.collectionName === Collections.Superusers ? authRecord : null;
};

const authRecordSingleton = ref<SuperusersResponse | null>(readSuperuserRecord());
let isAuthSubscribed = false;
const ensureAuthSubscription = () => {
  if (isAuthSubscribed) return;
  isAuthSubscribed = true;

  pb.authStore.onChange(() => {
    authRecordSingleton.value = readSuperuserRecord();
  }, true);
};

export const useAuth = () => {
  /* ======================= 변수 ======================= */
  ensureAuthSubscription();
  const authRecord = authRecordSingleton;
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const signIn = async (payload: SignInPayload) => {
    const loginId = normalizeSuperuserLoginId(payload.loginId);
    const password = String(payload.password ?? '').trim();

    if (!loginId) {
      throw new Error('아이디(loginId)가 필요합니다.');
    }
    if (!password) {
      throw new Error('비밀번호가 필요합니다.');
    }

    await pb.collection(Collections.Superusers).authWithPassword(loginId, password);
  };

  const signOut = () => {
    pb.authStore.clear();
  };
  /* ======================= 메서드 ======================= */

  return {
    authRecord: computed(() => authRecord.value),
    isSignedIn: computed(() => !!authRecord.value && pb.authStore.isValid),
    signIn,
    signOut,
  };
};
