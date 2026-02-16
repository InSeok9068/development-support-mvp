<template>
  <main class="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 py-6">
    <sl-card class="w-full">
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between gap-2">
          <div class="text-lg font-semibold">회원가입</div>
          <sl-button variant="text" @click="onClickGoSignIn">로그인</sl-button>
        </div>

        <div v-if="isSignedIn && authRecord" class="text-sm">
          현재 로그인: {{ authRecord.name || authRecord.email }}
        </div>

        <sl-input
          v-model="loginId"
          label="아이디 (PocketBase 로그인)"
          placeholder="예: kjcareer11 또는 test@example.com"
        ></sl-input>

        <sl-input v-model="kjcaId" label="KJCA 아이디 (mng_id)" placeholder="예: kjcareer11"></sl-input>

        <sl-input
          v-model="password"
          label="비밀번호 (PocketBase + KJCA 공통)"
          type="password"
          placeholder="비밀번호 입력"
          password-toggle
        ></sl-input>

        <sl-alert v-if="errorMessage" variant="danger" open>{{ errorMessage }}</sl-alert>
        <sl-alert v-if="successMessage" variant="success" open>{{ successMessage }}</sl-alert>

        <sl-button variant="primary" :loading="isSubmitting" @click="onClickSignUp">회원가입</sl-button>
        <sl-button variant="default" @click="onClickGoHome">홈으로</sl-button>
      </div>
    </sl-card>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAuth } from '@/composables/useAuth';

/* ======================= 변수 ======================= */
const router = useRouter();
const { authRecord, isSignedIn, signUp } = useAuth();

const loginId = ref('');
const kjcaId = ref('');
const password = ref('');

const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(
  () => loginId.value,
  (value) => {
    if (kjcaId.value) return;
    const id = String(value ?? '').trim();
    if (!id) return;
    kjcaId.value = id.includes('@') ? id.split('@')[0] : id;
  },
);
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickGoSignIn = async () => {
  await router.push('/sign-in');
};

const onClickGoHome = async () => {
  await router.push('/');
};

const onClickSignUp = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  isSubmitting.value = true;

  try {
    await signUp({
      loginId: loginId.value,
      password: password.value,
      kjcaId: kjcaId.value,
    });
    successMessage.value = '회원가입 및 로그인 완료';
    await router.push('/');
  } catch (error) {
    errorMessage.value = (error as { message?: string })?.message
      ? String((error as { message?: string }).message)
      : `${error}`;
  } finally {
    isSubmitting.value = false;
  }
};
/* ======================= 메서드 ======================= */
</script>
