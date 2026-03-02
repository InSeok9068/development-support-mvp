<template>
  <main class="page-enter mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6">
    <sl-card class="overflow-hidden">
      <div class="mb-4 text-lg font-semibold">계정 연결</div>

      <div class="mb-4 grid grid-cols-2 gap-2">
        <sl-button
          class="w-full"
          :variant="activeTab === 'signin' ? 'primary' : 'default'"
          @click="onClickSelectAuthTab('signin')"
        >
          로그인
        </sl-button>
        <sl-button
          class="w-full"
          :variant="activeTab === 'signup' ? 'primary' : 'default'"
          @click="onClickSelectAuthTab('signup')"
        >
          회원가입
        </sl-button>
      </div>

      <div v-if="'signin' === activeTab" class="flex flex-col gap-3">
        <sl-input v-model="signinArgs.email" type="email" label="이메일" placeholder="you@example.com"></sl-input>
        <sl-input v-model="signinArgs.password" type="password" label="비밀번호"></sl-input>
        <sl-button variant="primary" @click="onClickSigninButton">로그인</sl-button>
      </div>

      <div v-else class="flex flex-col gap-3">
        <sl-input v-model="signupArgs.name" label="이름"></sl-input>
        <sl-input v-model="signupArgs.email" type="email" label="이메일" placeholder="you@example.com"></sl-input>
        <sl-input v-model="signupArgs.password" type="password" label="비밀번호"></sl-input>
        <sl-button variant="primary" @click="onClickSignupButton">회원가입</sl-button>
      </div>
    </sl-card>
  </main>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/auth';
import { useModal } from '@packages/ui';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const router = useRouter();
const { createAuthSession, createUser, fetchAuthState } = useAuth();
const { showMessageModal } = useModal();
const activeTab = ref<'signin' | 'signup'>('signin');
const signinArgs = ref({
  email: '',
  password: '',
});
const signupArgs = ref({
  email: '',
  name: '',
  password: '',
});
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(async () => {
  if (fetchAuthState()) {
    await router.push('/');
  }
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickSelectAuthTab = (tab: 'signin' | 'signup') => {
  activeTab.value = tab;
};

const onClickSigninButton = async () => {
  if (!signinArgs.value.email || !signinArgs.value.password) {
    showMessageModal('이메일과 비밀번호를 입력해주세요.');
    return;
  }

  await createAuthSession(signinArgs.value.email, signinArgs.value.password);
};

const onClickSignupButton = async () => {
  if (!signupArgs.value.name || !signupArgs.value.email || !signupArgs.value.password) {
    showMessageModal('이름, 이메일, 비밀번호를 입력해주세요.');
    return;
  }

  await createUser(signupArgs.value);
  showMessageModal('회원가입이 완료되었습니다. 로그인 탭에서 로그인해주세요.');
  activeTab.value = 'signin';
};
/* ======================= 메서드 ======================= */
</script>
