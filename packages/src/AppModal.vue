<template>
  <sl-dialog :open="modal.show" :label="modal.title" @sl-request-close="onRequestCloseModal">
    <div class="text-sm text-slate-700">{{ modal.message }}</div>
    <sl-button slot="footer" variant="primary" @click="clearModal">확인</sl-button>
  </sl-dialog>
</template>

<script setup lang="ts">
import { useModal } from './composables/modal';

/* ======================= 변수 ======================= */
const { modal, clearModal } = useModal();
/* ======================= 변수 ======================= */

/* ======================= 메서드 ======================= */
const onRequestCloseModal = () => {
  clearModal();
};
/* ======================= 메서드 ======================= */
</script>
