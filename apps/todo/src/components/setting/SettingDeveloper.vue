<template>
  <sl-details summary="개발자 설정">
    <div class="mt-3">
      <div class="flex flex-col gap-3">
        <div class="text-xs font-semibold text-slate-500">개발자</div>
        <div class="flex flex-wrap gap-2">
          <template v-for="developer in developers" :key="developer.id">
            <sl-button size="small" variant="default" @click.stop.prevent="onClickDeveloper(developer)">
              {{ developer.name }}
            </sl-button>
          </template>
        </div>

        <input v-model="developerArgs.id" type="text" hidden />

        <sl-input v-model="developerArgs.name" label="이름" placeholder="이름을 입력하세요"></sl-input>
        <sl-input v-model="developerArgs.sort" type="number" label="정렬" placeholder="정렬 순서"></sl-input>

        <sl-button variant="primary" @click="onClickSave">저장</sl-button>
      </div>
    </div>
  </sl-details>
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
