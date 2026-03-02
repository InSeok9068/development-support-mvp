<template>
  <main class="page-enter mx-auto flex min-h-screen w-full max-w-md flex-col gap-3 px-4 pb-24 pt-4">
    <header class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">스냅</h1>
      <sl-tag size="small" variant="neutral">외부 링크</sl-tag>
    </header>

    <sl-card>
      <div class="flex flex-col gap-3">
        <div class="text-sm font-semibold">무신사 스냅</div>
        <div class="text-sm">트렌드 코디를 참고할 수 있는 외부 스냅 페이지입니다.</div>
        <sl-button class="w-full" variant="primary" @click="onClickOpenMusinsaSnapButton">무신사 스냅 열기</sl-button>
      </div>
    </sl-card>

    <sl-card>
      <div class="text-sm">추후 다른 스냅 소스도 이 화면에 순차적으로 추가할 수 있습니다.</div>
    </sl-card>

    <AppBottomNav />
  </main>
</template>

<script setup lang="ts">
import { useAuthGuard } from '@/composables/auth-guard';
import { onMounted } from 'vue';

const MUSINSA_SNAP_URL = 'https://www.musinsa.com/snap/main/recommend?gf=M';

/* ======================= 변수 ======================= */
const { fetchAuthStateOrRedirect } = useAuthGuard();
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(async () => {
  await fetchAuthStateOrRedirect();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickOpenMusinsaSnapButton = () => {
  const openedWindow = window.open(MUSINSA_SNAP_URL, '_blank', 'noopener,noreferrer');
  if (openedWindow) {
    openedWindow.opener = null;
    return;
  }

  const externalLinkElement = document.createElement('a');
  externalLinkElement.href = MUSINSA_SNAP_URL;
  externalLinkElement.target = '_blank';
  externalLinkElement.rel = 'noopener noreferrer external';
  externalLinkElement.click();
};
/* ======================= 메서드 ======================= */
</script>
