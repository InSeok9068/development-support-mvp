<template>
  <RouterView />
  <AppModal />
</template>

<script setup lang="ts">
import { usePocketbase } from '@/composables/pocketbase';
import { AppModal } from '@packages/ui';
import { onMounted } from 'vue';

/* ======================= 변수 ======================= */
const { initPocketbase } = usePocketbase();
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  initPocketbase();
});
/* ======================= 생명주기 훅 ======================= */
</script>
