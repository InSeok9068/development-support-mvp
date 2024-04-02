<template>
  <header class="container">
    <nav>
      <ul>
        <li>
          <h3>업무관리</h3>
        </li>
        <li><router-link to="/">TODO</router-link></li>
        <li><router-link to="/list">LIST</router-link></li>
      </ul>
      <ul>
        <li v-show="!isAuth">
          <button @click="onClickSignin">로그인</button>
        </li>
        <li v-show="isAuth">
          <button @click="signout">로그아웃</button>
        </li>
        <li v-show="setting.theme === 'dark'">
          <i class="bi bi-brightness-high" style="cursor: pointer" @click="toggleTheme"></i>
        </li>
        <li v-show="setting.theme === 'white'">
          <i class="bi bi-brightness-high-fill" style="cursor: pointer" @click="toggleTheme"></i>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup>
import { useSetting } from '@/composables/setting';
import { useSign } from '@/composables/sign';
import { useRouter } from 'vue-router';
const router = useRouter();
const { signout, isAuth } = useSign();
const { setting, toggleTheme } = useSetting();

const onClickSignin = () => router.push('/sign');
</script>
