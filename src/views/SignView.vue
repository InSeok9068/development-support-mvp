<template>
  <main class="container">
    <article>
      <h2>로그인</h2>
      <input type="text" v-model="signinFormArgs.email" placeholder="이메일" />
      <input type="password" v-model="signinFormArgs.password" placeholder="패스워드" />
      <input type="button" value="로그인" @click="signin" />
    </article>

    <article>
      <h2>회원가입</h2>
      <input type="text" v-model="signupFormArgs.nickname" placeholder="닉네임" />
      <input type="text" v-model="signupFormArgs.email" placeholder="이메일" />
      <input type="password" v-model="signupFormArgs.password" placeholder="패스워드" />
      <input type="button" value="회원가입" @click="signup" />
    </article>
  </main>
</template>

<script setup lang="ts">
import { useSign } from '@/composables/sign';

const { signinFormArgs, signupFormArgs, signin, signup } = useSign();
</script>
