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

const { signinFormArgs, signupFormArgs, signin, signup } = useSign();
</script>
