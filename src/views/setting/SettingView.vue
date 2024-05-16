<template>
  <main class="container">
    <article>
      <details>
        <summary role="button" class="outline contrast">개발자 설정</summary>
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
          <input type="button" value="저장" @click="onClickSave_1" />
        </article>
      </details>
      <details>
        <summary role="button" class="outline contrast">마감일자 임박 설정</summary>
        <article>
          <label>
            마감일자 임박
            <input type="number" />
            <input type="button" value="저장" @click="onClickSave_2" />
          </label>
        </article>
      </details>
    </article>
  </main>
</template>

<script setup lang="ts">
import type { DevelopersResponse } from '@/api/pocketbase-types';
import { useDeveloper } from '@/composables/todo/developer';
import { cloneDeep } from 'lodash-es';
import { onMounted } from 'vue';

const { developerArgs, developers, selectDeveloperFullList, createDeveloper, updateDeveloper } = useDeveloper();
// const {} = useSetting();

onMounted(() => {
  selectDeveloperFullList();
});

const onClickDeveloper = (developer: DevelopersResponse) => {
  developerArgs.value = cloneDeep(developer);
};

const onClickSave_1 = () => {
  if (developerArgs.value.id) {
    updateDeveloper();
  } else {
    createDeveloper();
  }
};

const onClickSave_2 = () => {};
</script>
