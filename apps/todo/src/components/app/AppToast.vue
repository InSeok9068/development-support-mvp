<template>
  <div class="absolute top-0 right-5">
    <article :class="{ 'fade-in': toast.show, 'fade-out': !toast.show }">
      <header>
        <h5>알림</h5>
      </header>
      <span>{{ toast.message }}</span>
    </article>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/toast';
import { onUnmounted, watch } from 'vue';

/* ======================= 변수 ======================= */
const { toast } = useToast();
let timer: number;
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(toast.value, (v) => {
  if (v) {
    if (toast.value.show) {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        toast.value.show = false;
        toast.value.message = '';
      }, toast.value.dutationMs);
    }
  }
});
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
onUnmounted(() => {
  clearTimeout(timer);
});
/* ======================= 생명주기 훅 ======================= */
</script>

<style scoped>
.fade-in {
  display: block;
  animation: var(--animation-shake-y), var(--animation-slide-in-left);
}

.fade-out {
  display: none;
}
</style>
