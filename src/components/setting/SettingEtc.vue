<template>
  <details>
    <summary role="button" class="outline contrast">기타 설정</summary>
    <article>
      <label>
        마감일자 임박
        <input type="number" />
        <input type="button" value="저장" @click="$emit('save')" />
      </label>
    </article>
  </details>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'save'): void;
}>();
</script>
