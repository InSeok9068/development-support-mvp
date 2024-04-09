<template>
  <TheLayoutNavi></TheLayoutNavi>
  <TheLaytout></TheLaytout>
  <AppModal></AppModal>
</template>

<script setup lang="ts">
import pb from '@/api/pocketbase';
import AppModal from '@/components/app/AppModal.vue';
import { useModal } from '@/composables/modal';
import { usePocketbase } from '@/composables/pocketbase';
import { useDeveloper } from '@/composables/todo/developer';
import { useSign } from '@/composables/user/sign';
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
const keys = useMagicKeys();

watch(keys.escape, (v) => {
  if (v) {
    message.value = '';
  }
});

onMounted(async () => {
  initPocketbase();
  isAuth.value = pb.authStore.isAuthRecord;
  !isAuth.value && router.push('/sign');

  await setDefaultDeveloper();
});
</script>
@/composables/todo/developer @/composables/user/sign
