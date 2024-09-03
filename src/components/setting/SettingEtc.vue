<template>
  <details>
    <summary role="button" class="contrast outline">기타 설정</summary>
    <article>
      <label>
        마감일자 임박
        <input v-model="settingArgs.daysBefore" type="number" />
        <input type="button" value="저장" @click="$emit('save')" />
      </label>
    </article>
  </details>
</template>

<script setup lang="ts">
import type { SettingJson } from '@/stores/setting.store';

/* ======================= 변수 ======================= */
const settingArgs = defineModel<SettingJson>({ required: true });
defineEmits<{
  (e: 'save'): void;
}>();
/* ======================= 변수 ======================= */
</script>
