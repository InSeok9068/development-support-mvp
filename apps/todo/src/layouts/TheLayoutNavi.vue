<template>
  <header class="container mx-auto flex w-full items-center justify-between px-4 py-3">
    <div class="flex items-center gap-3">
      <RouterLink to="/" class="text-lg font-semibold tracking-tight">업무관리</RouterLink>
      <div class="hidden items-center sm:flex">
        <sl-tooltip content="Alt + 1">
          <sl-button size="small" variant="text" @click="router.push('/')">Todo</sl-button>
        </sl-tooltip>
        <sl-tooltip content="Alt + 2">
          <sl-button size="small" variant="text" @click="router.push('/kanban')">Kanban</sl-button>
        </sl-tooltip>
        <sl-tooltip content="Alt + 3">
          <sl-button size="small" variant="text" @click="router.push('/list')">List</sl-button>
        </sl-tooltip>
        <sl-tooltip content="Alt + 4">
          <sl-button size="small" variant="text" @click="router.push('/calendar')">Calendar</sl-button>
        </sl-tooltip>
        <sl-tooltip content="Alt + 5">
          <sl-button size="small" variant="text" @click="router.push('/dashboard')">Dashboard</sl-button>
        </sl-tooltip>
        <sl-tooltip content="Alt + 6">
          <sl-button size="small" variant="text" @click="router.push('/project-gantt')"> Project Gantt </sl-button>
        </sl-tooltip>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <div class="sm:hidden">
        <sl-dropdown placement="bottom-start">
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <sl-button slot="trigger" variant="text">
            <i class="bi-list-ul"></i>
          </sl-button>
          <div class="flex flex-col gap-1 p-2">
            <sl-button variant="text" class="justify-start" @click="router.push('/')">Todo</sl-button>
            <sl-button variant="text" class="justify-start" @click="router.push('/kanban')"> Kanban </sl-button>
            <sl-button variant="text" class="justify-start" @click="router.push('/list')">List</sl-button>
            <sl-button variant="text" class="justify-start" @click="router.push('/calendar')"> Calendar </sl-button>
            <sl-button variant="text" class="justify-start" @click="router.push('/dashboard')"> Dashboard </sl-button>
            <sl-button variant="text" class="justify-start" @click="router.push('/project-gantt')">
              Project Gantt
            </sl-button>
          </div>
        </sl-dropdown>
      </div>

      <sl-dropdown placement="bottom-end">
        <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
        <sl-button slot="trigger" size="small" variant="text">
          <i class="bi-gear-fill"></i>
        </sl-button>
        <div class="flex flex-col gap-1 p-2">
          <sl-button v-if="!isAuth" size="small" variant="text" class="justify-start" @click="onClickGoSign">
            로그인
          </sl-button>
          <sl-button size="small" variant="text" class="justify-start" @click="onClickGoSetting">설정</sl-button>
          <sl-button size="small" variant="text" class="justify-start" @click="onClickClear">클리어</sl-button>
          <sl-button v-if="isAuth" size="small" variant="text" class="justify-start" @click="onClickSignout">
            로그아웃
          </sl-button>
        </div>
      </sl-dropdown>

      <div class="relative">
        <sl-button size="small" variant="text" @click.stop.prevent="onClickGoNotification">
          <i
            :class="{
              'bi-bell': global.notificationPermission === 'granted',
              'bi-bell-slash': global.notificationPermission !== 'granted',
            }"
          ></i>
        </sl-button>
        <span
          v-show="global.notificationDot"
          class="absolute top-1 right-1 h-1 w-1 animate-ping rounded-full bg-red-700"
        ></span>
      </div>

      <sl-button size="small" variant="text" @click="onClickToggleTheme">
        <i
          :class="{
            'bi-brightness-high': global.theme === 'dark',
            'bi-brightness-high-fill': global.theme === 'white',
          }"
        ></i>
      </sl-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useGlobal } from '@/composables/global';
import { useSign } from '@/composables/user/sign';
import { useMagicKeys } from '@vueuse/core';
import { watch } from 'vue';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const keys = useMagicKeys();
const router = useRouter();
const { signout, isAuth } = useSign();
const { global, toggleTheme } = useGlobal();
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(keys.alt_1, (v) => v && router.push('/'));
watch(keys.alt_2, (v) => v && router.push('/kanban'));
watch(keys.alt_3, (v) => v && router.push('/list'));
watch(keys.alt_4, (v) => v && router.push('/calendar'));
watch(keys.alt_5, (v) => v && router.push('/dashboard'));
watch(keys.alt_6, (v) => v && router.push('/project-gantt'));
/* ======================= 감시자 ======================= */

/* ======================= 메서드 ======================= */
const onClickGoSign = () => router.push('/sign');
const onClickGoSetting = () => router.push('/setting');
const onClickGoNotification = () => router.push('/notification');
const onClickClear = () => localStorage.clear();
const onClickToggleTheme = () => toggleTheme();
const onClickSignout = () => signout();
/* ======================= 메서드 ======================= */
</script>
