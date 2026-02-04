<template>
  <details>
    <summary role="button" class="contrast outline">개발자 설정</summary>
    <article>
      <label>개발자</label>
      <div role="group">
        <template v-for="developer in developers" :key="developer.id">
          <a href="#" @click.stop.prevent="onClickDeveloper(developer)">{{ developer.name }}</a>
        </template>
      </div>
      <input v-model="developerArgs.id" hidden />
      <label>
        이름
        <input v-model="developerArgs.name" />
      </label>
      <label>
        정렬
        <input v-model="developerArgs.sort" type="number" />
      </label>
      <input type="button" value="저장" @click="onClickSave" />
    </article>
  </details>
</template>

<script setup lang="ts">
import type { DevelopersResponse } from '@/api/pocketbase-types';
import type { UiDeveloperArgs } from '@/ui/todo.ui';
import { cloneDeep } from 'es-toolkit';

/* ======================= 변수 ======================= */
const developerArgs = defineModel<UiDeveloperArgs>('developerArgs', { required: true });
const developers = defineModel<DevelopersResponse[]>('developers', { required: true });
const emit = defineEmits<{
  (e: 'save'): void;
}>();
/* ======================= 변수 ======================= */

/* ======================= 메서드 ======================= */
const onClickDeveloper = (developer: DevelopersResponse) => {
  developerArgs.value = cloneDeep(developer);
};

const onClickSave = () => {
  emit('save');
};
/* ======================= 메서드 ======================= */
</script>
