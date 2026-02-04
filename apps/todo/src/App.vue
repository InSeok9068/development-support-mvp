<template>
  <TheLayoutNavi />
  <TheLaytout />
  <TheLaytoutFooter />
  <AppModal />
  <AppToast />
</template>

<script setup lang="ts">
import { useCode } from '@/composables/code';
import { useGlobal } from '@/composables/global';
import { useNotification } from '@/composables/notification';
import { usePocketbase } from '@/composables/pocketbase';
import { useSetting } from '@/composables/setting';
import { useSign } from '@/composables/user/sign';
import TheLaytoutFooter from '@/layouts/TheLayoutFooter.vue';
import TheLayoutNavi from '@/layouts/TheLayoutNavi.vue';
import TheLaytout from '@/layouts/TheLaytout.vue';
import { AppModal, useModal } from '@packages/ui';
import { useMagicKeys } from '@vueuse/core';
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const router = useRouter();
const { checkAuth } = useSign();
const { initPocketbase } = usePocketbase();
const { modal, clearModal } = useModal();
const { fetchUnreadCount, subscribeNotificationsByPermission } = useNotification();
const { global, initTheme } = useGlobal();
const { fetchCodeList } = useCode();
const { initSetting } = useSetting();
const keys = useMagicKeys();
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(keys.escape, (v) => {
  if (v) {
    if (modal.value) {
      clearModal();
    }
  }
});

watch(keys.enter, (v) => {
  if (v) {
    if (modal.value) {
      clearModal();
    }
  }
});
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(async () => {
  // 초기화 작업
  initPocketbase(); // 포켓베이스 초기화
  initTheme(); // 테마 설정
  await fetchCodeList(); // 시스템 코드 설정

  // 로그인 확인 및 유도
  if (!checkAuth()) {
    await router.push('/sign'); // 미인증 회원 로그인 유도
    return;
  }

  await initSetting(); // 셋팅 초기화

  // 메인 진입 시 필요 API 호출
  await fetchUnreadCount(); // 미확인 알림 확인

  // 알림 관련 작업
  if (typeof Notification !== 'undefined') {
    const permission = global.value.notificationPermission;
    if (permission === 'prompt') {
      const shouldRequest = window.confirm('알림을 받으려면 브라우저 알림 권한이 필요합니다. 지금 허용하시겠어요?');
      if (shouldRequest) {
        await Notification.requestPermission();
      }
    }
    subscribeNotificationsByPermission(global.value.notificationPermission);
  }
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */

/* ======================= 메서드 ======================= */
</script>
