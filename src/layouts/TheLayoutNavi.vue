<template>
  <header class="container">
    <nav>
      <ul>
        <li>
          <h3><a class="contrast" href="/">업무관리</a></h3>
        </li>
        <li></li>
        <li>
          <router-link to="/"><strong>Todo</strong></router-link>
        </li>
        <li>
          <router-link to="/list"><strong>List</strong></router-link>
        </li>
        <li>
          <router-link to="/calendar"><strong>Calendar</strong></router-link>
        </li>
      </ul>
      <ul>
        <li>
          <details class="dropdown">
            <summary><i class="bi bi-gear-fill"></i></summary>
            <ul>
              <li v-show="!isAuth">
                <a href="#" @click.stop.prevent="onClickSignin">로그인</a>
              </li>
              <li>
                <a href="#" @click.stop.prevent="onClickSetting">설정</a>
              </li>
              <li>
                <a href="#" @click.stop.prevent="onClickClear">클리어</a>
              </li>
              <li v-show="isAuth">
                <a href="#" @click.stop.prevent="signout">로그아웃</a>
              </li>
            </ul>
          </details>
        </li>
        <li>
          <i
            :class="{
              'bi bi-bell': setting.notificationPermission === 'granted',
              'bi bi-bell-slash': setting.notificationPermission !== 'granted',
            }"
          ></i>
        </li>
        <li>
          <i
            class="cursor-pointer"
            :class="{
              'bi bi-brightness-high': setting.theme === 'dark',
              'bi bi-brightness-high-fill': setting.theme === 'white',
            }"
            @click="toggleTheme"
          ></i>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { useSetting } from '@/composables/setting';
import { useSign } from '@/composables/user/sign';
import { useRouter } from 'vue-router';

const router = useRouter();
const { signout, isAuth } = useSign();
const { setting, toggleTheme } = useSetting();

const onClickSignin = () => router.push('/sign');

const onClickSetting = () => router.push('/setting');

const onClickClear = () => localStorage.clear();
</script>
