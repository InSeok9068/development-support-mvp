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
      <div class="flex flex-col gap-3">
        <div class="text-sm font-semibold">온더룩</div>
        <div class="text-sm">남성 코디 스냅을 빠르게 참고할 수 있는 외부 스냅 페이지입니다.</div>
        <sl-button class="w-full" variant="primary" @click="onClickOpenOnTheLookSnapButton">온더룩 열기</sl-button>
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
const ONTHELOOK_SNAP_URL = 'https://onthelook.co.kr/?initFilter={%22styleTagIds%22:[],%22gender%22:[%22MEN%22],%22height%22:[],%22weight%22:[],%22season%22:[]}';

/* ======================= 변수 ======================= */
const { fetchAuthStateOrRedirect } = useAuthGuard();
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(async () => {
  await fetchAuthStateOrRedirect();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const isStandaloneDisplayMode = () => {
  const displayModeMatched = typeof window.matchMedia === 'function' ? window.matchMedia('(display-mode: standalone)').matches : false;
  const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return displayModeMatched || iosStandalone;
};

const buildAndroidIntentUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const pathWithSearch = `${parsedUrl.pathname}${parsedUrl.search}`;
    return `intent://${parsedUrl.host}${pathWithSearch}#Intent;scheme=${parsedUrl.protocol.replace(':', '')};action=android.intent.action.VIEW;end`;
  } catch {
    return url;
  }
};

const openExternalSnapUrl = (url: string) => {
  const isAndroid = /android/i.test(window.navigator.userAgent);
  if (isAndroid && isStandaloneDisplayMode()) {
    window.location.href = buildAndroidIntentUrl(url);
    return;
  }

  const externalLinkElement = document.createElement('a');
  externalLinkElement.href = url;
  externalLinkElement.target = '_blank';
  externalLinkElement.rel = 'noopener noreferrer external';
  document.body.appendChild(externalLinkElement);
  externalLinkElement.click();
  externalLinkElement.remove();
};

const onClickOpenMusinsaSnapButton = () => {
  openExternalSnapUrl(MUSINSA_SNAP_URL);
};

const onClickOpenOnTheLookSnapButton = () => {
  openExternalSnapUrl(ONTHELOOK_SNAP_URL);
};
/* ======================= 메서드 ======================= */
</script>
