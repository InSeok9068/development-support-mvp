<template>
  <main class="container">
    <article>
      <h2>로그인</h2>
      <input v-model="signinFormArgs.email" type="text" placeholder="이메일" />
      <input v-model="signinFormArgs.password" type="password" placeholder="패스워드" />
      <input type="button" value="로그인" @click="signin" />
    </article>

    <article>
      <h2>회원가입</h2>
      <input v-model="signupFormArgs.nickname" type="text" placeholder="닉네임" />
      <input v-model="signupFormArgs.email" type="text" placeholder="이메일" />
      <input v-model="signupFormArgs.password" type="password" placeholder="패스워드" />
      <input type="button" value="회원가입" @click="signup" />
    </article>
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
/* ======================= 변수 ======================= */

/* ======================= 메서드 ======================= */
const signin = async () => {
  await requestSignin(signinFormArgs.value.email, signinFormArgs.value.password);
};

const signup = async () => {
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
