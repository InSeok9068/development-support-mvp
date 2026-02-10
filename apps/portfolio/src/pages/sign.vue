<template>
  <main class="container mx-auto p-4">
    <div class="mx-auto flex w-full max-w-lg flex-col gap-4">
      <sl-card class="w-full">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <h3>로그인</h3>
            <div class="text-xs text-slate-500 dark:text-slate-400">이 로그인은 관리자 페이지를 위한 절차입니다.</div>
          </div>

          <div class="flex items-center gap-2">
            <sl-button
              size="small"
              :variant="activeTab === 'signin' ? 'primary' : 'default'"
              @click="onClickSelectTab('signin')"
            >
              관리자 로그인
            </sl-button>
            <sl-button
              size="small"
              :variant="activeTab === 'signup' ? 'primary' : 'default'"
              @click="onClickSelectTab('signup')"
            >
              회원가입
            </sl-button>
          </div>

          <div v-if="activeTab === 'signin'" class="flex flex-col gap-3">
            <sl-alert variant="neutral" open> 일반 사용자는 이 메뉴를 사용할 필요가 없습니다. </sl-alert>
            <sl-input v-model="signinFormArgs.email" type="email" label="이메일" placeholder="admin@example.com" />
            <sl-input v-model="signinFormArgs.password" type="password" label="비밀번호" />
            <div class="flex items-center gap-2">
              <sl-button variant="primary" :loading="isSubmitting" @click="onClickSignin"> 로그인 </sl-button>
              <sl-button variant="default" @click="onClickBack"> 돌아가기 </sl-button>
            </div>
          </div>

          <div v-else class="flex flex-col gap-3">
            <sl-alert variant="neutral" open>
              회원가입은 일반 사용자 계정 생성용입니다. 관리자 기능과 무관합니다.
            </sl-alert>
            <sl-input v-model="signupFormArgs.name" label="이름" placeholder="이름" />
            <sl-input v-model="signupFormArgs.email" type="email" label="이메일" placeholder="you@example.com" />
            <sl-input v-model="signupFormArgs.password" type="password" label="비밀번호" />
            <sl-input v-model="signupFormArgs.passwordConfirm" type="password" label="비밀번호 확인" />
            <sl-alert v-if="signupSuccess" variant="success" open> 회원가입이 완료되었습니다. </sl-alert>
            <div class="flex items-center gap-2">
              <sl-button variant="primary" :loading="isSubmitting" @click="onClickSignup"> 회원가입 </sl-button>
              <sl-button variant="default" @click="onClickBack"> 돌아가기 </sl-button>
            </div>
          </div>
        </div>
      </sl-card>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const router = useRouter();
const { createAuthSession, createUserAccount, isSuperuser, fetchAuthState } = useAuth();
const isSubmitting = ref(false);
const signinFormArgs = ref({
  email: '',
  password: '',
});
const signupFormArgs = ref({
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
});
const activeTab = ref<'signin' | 'signup'>('signin');
const signupSuccess = ref(false);
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickSignin = () => {
  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  createAuthSession(signinFormArgs.value.email, signinFormArgs.value.password)
    .then(() => {
      if (isSuperuser.value) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    })
    .finally(() => {
      isSubmitting.value = false;
    });
};

const onClickSignup = () => {
  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  signupSuccess.value = false;
  createUserAccount({
    name: signupFormArgs.value.name,
    email: signupFormArgs.value.email,
    password: signupFormArgs.value.password,
    passwordConfirm: signupFormArgs.value.passwordConfirm,
    tokenKey: '',
  })
    .then(() => {
      signupSuccess.value = true;
    })
    .finally(() => {
      isSubmitting.value = false;
    });
};

const onClickSelectTab = (tab: 'signin' | 'signup') => {
  activeTab.value = tab;
  signupSuccess.value = false;
};

const onClickBack = () => {
  fetchAuthState();
  router.push('/');
};
/* ======================= 메서드 ======================= */
</script>
