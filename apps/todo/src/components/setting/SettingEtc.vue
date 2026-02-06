<template>
  <sl-details summary="기타 설정">
    <div class="mt-3 flex flex-col gap-3">
      <sl-input v-model="settingArgs.daysBefore" type="number" label="마감일자 임박" placeholder="예: 3"></sl-input>
      <sl-button variant="primary" @click="onClickSave">저장</sl-button>
    </div>
  </sl-details>
</template>

<script setup lang="ts">
import type { SettingJson } from '@/stores/setting.store';

/* ======================= 변수 ======================= */
const settingArgs = defineModel<SettingJson>({ required: true });
const emit = defineEmits<{
  (e: 'save'): void;
}>();
/* ======================= 변수 ======================= */

/* ======================= 메서드 ======================= */
const onClickSave = () => {
  emit('save');
};
/* ======================= 메서드 ======================= */
</script>
