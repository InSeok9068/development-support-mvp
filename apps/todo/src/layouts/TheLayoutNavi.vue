<template>
  <header class="container mx-auto flex w-full items-center justify-between px-4 py-3">
    <div class="flex items-center gap-3">
      <RouterLink to="/" class="text-lg font-semibold tracking-tight">업무관리</RouterLink>
      <div class="sm:hidden">
        <sl-dropdown placement="bottom-start">
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <sl-button slot="trigger" variant="text">
            <sl-icon name="list-ul"></sl-icon>
          </sl-button>
          <sl-menu>
            <sl-menu-item @click="router.push('/')">Todo</sl-menu-item>
            <sl-menu-item @click="router.push('/kanban')">Kanban</sl-menu-item>
            <sl-menu-item @click="router.push('/list')">List</sl-menu-item>
            <sl-menu-item @click="router.push('/calendar')">Calendar</sl-menu-item>
            <sl-menu-item @click="router.push('/dashboard')">Dashboard</sl-menu-item>
            <sl-menu-item @click="router.push('/project-gantt')">Project Gantt</sl-menu-item>
          </sl-menu>
        </sl-dropdown>
      </div>
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
      <sl-dropdown placement="bottom-end">
        <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
        <sl-button slot="trigger" size="small" variant="text">
          <sl-icon name="gear-fill"></sl-icon>
        </sl-button>
        <sl-menu>
          <sl-menu-item v-if="!isAuth" @click="onClickGoSign">로그인</sl-menu-item>
          <sl-menu-item @click="onClickGoSetting">설정</sl-menu-item>
          <sl-menu-item @click="onClickClear">클리어</sl-menu-item>
          <sl-menu-item v-if="isAuth" @click="onClickSignout">로그아웃</sl-menu-item>
        </sl-menu>
      </sl-dropdown>

      <div class="relative">
        <sl-button size="small" variant="text" @click.stop.prevent="onClickGoNotification">
          <sl-icon :name="global.notificationPermission === 'granted' ? 'bell' : 'bell-slash'"></sl-icon>
        </sl-button>
        <span
          v-show="global.notificationDot"
          class="absolute top-1 right-1 h-1 w-1 animate-ping rounded-full bg-red-700"
        ></span>
      </div>

      <sl-button size="small" variant="text" @click="onClickToggleTheme">
        <sl-icon :name="global.theme === 'dark' ? 'brightness-high' : 'brightness-high-fill'"></sl-icon>
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
