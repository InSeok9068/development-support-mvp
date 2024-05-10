<template>
  <TheLayoutNavi />
  <TheLaytout />
  <TheLaytoutFooter />
  <AppModal />
</template>

<script setup lang="ts">
import pb from '@/api/pocketbase';
import AppModal from '@/components/app/AppModal.vue';
import { useModal } from '@/composables/modal';
import { useNotification } from '@/composables/notification';
import { usePocketbase } from '@/composables/pocketbase';
import { useSetting } from '@/composables/setting';
import { useDeveloper } from '@/composables/todo/developer';
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
const { setDefaultDeveloper } = useDeveloper();
const { notificationSubscribe } = useNotification();
const { initTheme, setting } = useSetting();

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
  initTheme(); // 테마 설정
  initPocketbase(); // 포켓베이스 초기화

  isAuth.value = pb.authStore.isAuthRecord; // 로그인 여부
  !isAuth.value && router.push('/sign'); // 미인증 회원 로그인 유도

  Notification.requestPermission(); // 알림 권한 요청
  notificationSubscribe(setting.value.notificationPermission === 'granted'); // 알림 구독 활성화

  setDefaultDeveloper(); // 디폴트 개발자 셋팅
});
</script>
