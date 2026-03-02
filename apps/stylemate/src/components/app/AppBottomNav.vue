<template>
  <nav class="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4 pb-4">
    <div class="rounded-2xl border border-slate-200/90 bg-white/95 p-2 backdrop-blur">
      <ul class="grid grid-cols-4 gap-1">
        <li v-for="item in navItems" :key="item.path">
          <sl-button
            class="bottom-nav-item w-full"
            :class="isActivePath(item.path) ? 'is-active' : 'is-inactive'"
            size="small"
            @click="onClickMovePage(item.path)"
          >
            <div class="flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium">
              <sl-icon :name="item.icon" class="text-sm"></sl-icon>
              <span>{{ item.label }}</span>
            </div>
          </sl-button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

type BottomNavItem = {
  icon: string;
  label: string;
  path: string;
};

/* ======================= 변수 ======================= */
const router = useRouter();
const route = useRoute();
const navItems: BottomNavItem[] = [
  { icon: 'house', label: '홈', path: '/' },
  { icon: 'journal-check', label: '코디일지', path: '/diary' },
  { icon: 'camera', label: '스냅', path: '/snap' },
  { icon: 'gear', label: '설정', path: '/settings' },
];
/* ======================= 변수 ======================= */

/* ======================= 메서드 ======================= */
const isActivePath = (path: string) => route.path === path;

const onClickMovePage = async (path: string) => {
  if (route.path === path) {
    if (path === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }

  await router.push(path);
};
/* ======================= 메서드 ======================= */
</script>
