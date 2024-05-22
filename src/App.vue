<template>
  <TheLayoutNavi />
  <TheLaytout />
  <TheLaytoutFooter />
  <AppModal />
</template>

<script setup lang="ts">
import pb from '@/api/pocketbase';
import AppModal from '@/components/app/AppModal.vue';
import { useCode } from '@/composables/code';
import { useModal } from '@/composables/modal';
import { useNotification } from '@/composables/notification';
import { usePocketbase } from '@/composables/pocketbase';
import { useSetting } from '@/composables/setting';
import { useSign } from '@/composables/user/sign';
import TheLaytoutFooter from '@/layouts/TheLayoutFooter.vue';
import TheLayoutNavi from '@/layouts/TheLayoutNavi.vue';
import TheLaytout from '@/layouts/TheLaytout.vue';
import { useMagicKeys } from '@vueuse/core';
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { isAuth } = useSign();
const { initPocketbase } = usePocketbase();
const { message } = useModal();
const { subscribeNotification, subscribeScheduledNotifications } = useNotification();
const { initTheme, setting } = useSetting();
const { initCodes } = useCode();

const keys = useMagicKeys();

watch(keys.escape, (v) => {
  if (v) {
    if (message.value) {
      message.value = '';
    }
  }
});

watch(keys.enter, (v) => {
  if (v) {
    if (message.value) {
      message.value = '';
    }
  }
});

onMounted(() => {
  initPocketbase(); // 포켓베이스 초기화
  initTheme(); // 테마 설정
  initCodes(); // 시스템 코드 설정

  isAuth.value = pb.authStore.isAuthRecord; // 로그인 여부
  !isAuth.value && router.push('/sign'); // 미인증 회원 로그인 유도

  Notification.requestPermission(); // 알림 권한 요청
  subscribeNotification(setting.value.notificationPermission === 'granted'); // 알림 구독 활성화
  subscribeScheduledNotifications(setting.value.notificationPermission === 'granted'); // 스케줄 알림 생성 활성화
});
</script>
