import { computed, ref } from 'vue';

import pb from '@/api/pocketbase';
import { Collections, type UsersResponse } from '@/api/pocketbase-types';

type SignUpPayload = {
  loginId: string; // 이메일 또는 아이디(이메일이 아니면 내부에서 가짜 이메일로 변환)
  password: string;
  kjcaId: string; // 외부 사이트 mng_id
};

type SignInPayload = {
  loginId: string; // 이메일 또는 아이디(이메일이 아니면 내부에서 가짜 이메일로 변환)
  password: string;
};

const KJCA_EMAIL_DOMAIN = 'kjca.local';

const toAuthEmail = (loginId: string) => {
  const id = String(loginId ?? '').trim();
  if (!id) return '';
  if (id.includes('@')) return id;
  return `${id}@${KJCA_EMAIL_DOMAIN}`;
};

const authRecordSingleton = ref<UsersResponse | null>((pb.authStore.record as UsersResponse | null) ?? null);
let isAuthSubscribed = false;
const ensureAuthSubscription = () => {
  if (isAuthSubscribed) return;
  isAuthSubscribed = true;

  pb.authStore.onChange(() => {
    authRecordSingleton.value = (pb.authStore.record as UsersResponse | null) ?? null;
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
  const signUp = async (payload: SignUpPayload) => {
    const email = toAuthEmail(payload.loginId);
    const password = String(payload.password ?? '').trim();
    const kjcaId = String(payload.kjcaId ?? '').trim();

    if (!email) {
      throw new Error('아이디(loginId)가 필요합니다.');
    }
    if (!password) {
      throw new Error('비밀번호가 필요합니다.');
    }
    if (!kjcaId) {
      throw new Error('KJCA 아이디(mng_id)가 필요합니다.');
    }

    await pb.collection(Collections.Users).create({
      email,
      password,
      passwordConfirm: password,
      // 외부 사이트 mng_id는 users.name에 저장한다. (스키마에 이미 존재)
      name: kjcaId,
      // 외부 사이트 비밀번호는 users.kjcaPw에 평문 저장 (요청사항)
      kjcaPw: password,
    });

    // 가입 직후 바로 로그인까지 진행 (세션 확보)
    await pb.collection(Collections.Users).authWithPassword(email, password);
  };

  const signIn = async (payload: SignInPayload) => {
    const email = toAuthEmail(payload.loginId);
    const password = String(payload.password ?? '').trim();

    if (!email) {
      throw new Error('아이디(loginId)가 필요합니다.');
    }
    if (!password) {
      throw new Error('비밀번호가 필요합니다.');
    }

    await pb.collection(Collections.Users).authWithPassword(email, password);
  };

  const signOut = () => {
    pb.authStore.clear();
  };
  /* ======================= 메서드 ======================= */

  return {
    authRecord: computed(() => authRecord.value),
    isSignedIn: computed(() => !!authRecord.value && pb.authStore.isValid),
    signUp,
    signIn,
    signOut,
  };
};
