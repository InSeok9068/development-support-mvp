<template>
  <sl-alert
    ref="toastRef"
    variant="primary"
    :duration="toast.dutationMs ?? 3000"
    closable
    @sl-after-hide="onAfterHideToast"
  >
    <strong>알림</strong>
    <div class="text-sm">{{ toast.message }}</div>
  </sl-alert>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/toast';
import { onUnmounted, ref, watch } from 'vue';

/* ======================= 변수 ======================= */
const { toast } = useToast();
const toastRef = ref<(HTMLElement & { toast: () => void }) | null>(null);
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(toast.value, (v) => {
  if (v?.show && toast.value.message) {
    toastRef.value?.toast();
  }
});
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
onUnmounted(() => {
  toast.value.show = false;
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onAfterHideToast = () => {
  toast.value.show = false;
  toast.value.message = '';
};
/* ======================= 메서드 ======================= */
</script>
