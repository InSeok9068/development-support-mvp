<template>
  <main class="container mx-auto">
    <div class="mx-auto w-full max-w-xl">
      <sl-card class="w-full">
        <div class="mb-4">
          <h3 class="text-lg font-semibold">계정</h3>
          <div class="text-xs text-slate-500">로그인 또는 회원가입</div>
        </div>

        <div class="mb-4 flex gap-2">
          <sl-button
            class="w-full"
            size="small"
            :variant="activeTab === 'signin' ? 'primary' : 'default'"
            @click="onClickSelectTab('signin')"
          >
            로그인
          </sl-button>
          <sl-button
            class="w-full"
            size="small"
            :variant="activeTab === 'signup' ? 'primary' : 'default'"
            @click="onClickSelectTab('signup')"
          >
            회원가입
          </sl-button>
        </div>

        <div v-if="activeTab === 'signin'" class="flex flex-col gap-3">
          <sl-input v-model="signinFormArgs.email" type="email" label="이메일" placeholder="you@example.com" />
          <sl-input v-model="signinFormArgs.password" type="password" label="패스워드" />
          <sl-button variant="primary" @click="onClickSignin">로그인</sl-button>
        </div>

        <div v-else class="flex flex-col gap-3">
          <sl-input v-model="signupFormArgs.nickname" label="닉네임" placeholder="닉네임" />
          <sl-input v-model="signupFormArgs.email" type="email" label="이메일" placeholder="you@example.com" />
          <sl-input v-model="signupFormArgs.password" type="password" label="패스워드" />
          <sl-button variant="primary" @click="onClickSignup">회원가입</sl-button>
        </div>
      </sl-card>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useSign } from '@/composables/user/sign';
import { useModal } from '@packages/ui';
import { ref } from 'vue';

/* ======================= 변수 ======================= */
const { signin: requestSignin, signup: requestSignup } = useSign();
const { showMessageModal } = useModal();
const signinFormArgs = ref({
  email: '',
  password: '',
});

const signupFormArgs = ref({
  email: '',
  nickname: '',
  password: '',
});
const activeTab = ref<'signin' | 'signup'>('signin');
/* ======================= 변수 ======================= */

/* ======================= 메서드 ======================= */
const onClickSelectTab = (tab: 'signin' | 'signup') => {
  activeTab.value = tab;
};

const onClickSignin = async () => {
  await requestSignin(signinFormArgs.value.email, signinFormArgs.value.password);
};

const onClickSignup = async () => {
  await requestSignup({
    name: signupFormArgs.value.nickname,
    email: signupFormArgs.value.email,
    password: signupFormArgs.value.password,
    passwordConfirm: signupFormArgs.value.password,
    username: '',
    tokenKey: '',
  });

  showMessageModal('회원가입이 완료되었습니다.');
};
/* ======================= 메서드 ======================= */
</script>
