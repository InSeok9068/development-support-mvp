<template>
  <header class="container">
    <nav>
      <ul>
        <li>
          <h3><a class="contrast" href="/">업무관리</a></h3>
        </li>
        <li></li>
        <li><router-link to="/">TODO</router-link></li>
        <li><router-link to="/list">LIST</router-link></li>
      </ul>
      <ul>
        <li v-show="setting.theme === 'dark'">
          <i class="bi bi-brightness-high" style="cursor: pointer" @click="toggleTheme"></i>
        </li>
        <li v-show="setting.theme === 'white'">
          <i class="bi bi-brightness-high-fill" style="cursor: pointer" @click="toggleTheme"></i>
        </li>
        <li>
          <details class="dropdown">
            <summary>설정</summary>
            <ul>
              <li v-show="!isAuth">
                <a href="#" @click="onClickSignin">로그인</a>
              </li>
              <li v-show="isAuth">
                <a href="#" @click="signout">로그아웃</a>
              </li>
              <li>
                <a href="#" @click="onClickClear">CLEAR</a>
              </li>
            </ul>
          </details>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { useSetting } from '@/composables/setting';
import { useSign } from '@/composables/user/sign';
import {} from 'pinia';
import { useRouter } from 'vue-router';

const router = useRouter();
const { signout, isAuth } = useSign();
const { setting, toggleTheme } = useSetting();

const onClickSignin = () => router.push('/sign');

const onClickClear = () => localStorage.clear();
</script>
