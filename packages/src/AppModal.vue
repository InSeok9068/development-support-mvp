<template>
  <sl-dialog :open="modal.show" :label="modal.title" @sl-request-close="onRequestCloseModal">
    <div class="text-sm text-slate-700">{{ modal.message }}</div>
      <sl-button v-if="modal.showCancel" slot="footer" class="mr-2" variant="default" @click="onClickCancel">
        {{ modal.cancelText ?? '취소' }}
      </sl-button>
    <sl-button slot="footer" variant="primary" @click="onClickConfirm">
      {{ modal.confirmText ?? '확인' }}
    </sl-button>
  </sl-dialog>
</template>

<script setup lang="ts">
import { useModal } from './composables/modal';

/* ======================= 변수 ======================= */
const { modal, clearModal } = useModal();
/* ======================= 변수 ======================= */

/* ======================= 메서드 ======================= */
const onClickConfirm = async () => {
  if (modal.value.fn) {
    await modal.value.fn();
  }
  clearModal();
};

const onClickCancel = async () => {
  if (modal.value.cancelFn) {
    await modal.value.cancelFn();
  }
  clearModal();
};

const onRequestCloseModal = () => {
  clearModal();
};
/* ======================= 메서드 ======================= */
</script>

