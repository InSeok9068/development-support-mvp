<template>
  <main class="container">
    <article>
      <h5 style="color: red">관리되고 있는 TODO가 10개가 넘지 않도록!!</h5>
      <div role="group">
        <button :class="{ outline: selectDeveloper }" @click="onClickSelectDeveoper(undefined)">ALL</button>
        <template v-for="developer in developers">
          <button :class="{ outline: selectDeveloper?.id !== developer.id }" @click="onClickSelectDeveoper(developer)">
            <span>{{ developer.name }}</span>
          </button>
        </template>
      </div>
      <fieldset role="group">
        <input v-model="workArgs.title" name="title" @keydown.enter="onClickCreateWork" />
        <input type="button" value="등록" @click="onClickCreateWork" />
      </fieldset>
      <ul v-for="work in works">
        <li>
          <h6>
            <input type="checkbox" @click.stop.prevent="doneWork(work)" />
            <a x-text="work.title" style="cursor: pointer" @click="router.push(`/detail/${work.id}`)">
              {{ work.title }}
            </a>
            <i class="bi bi-trash" style="cursor: pointer; margin-left: 10px" @click="deleteWork(work)"></i>
          </h6>
          <div class="grid">
            <label>
              개발자 :
              <span>
                {{ developers.find((developer) => developer.id === work.developer)?.name }}
              </span>
            </label>
            <label>
              생성일자 :
              <span>
                {{ dayjs(work.created).format('YYYY-MM-DD') }}
              </span>
            </label>
            <label>
              마감일자 :
              <span>
                {{ work.dueDate && dayjs(work.dueDate).format('YYYY-MM-DD') }}
              </span>
            </label>
          </div>
        </li>
      </ul>
    </article>
  </main>
</template>

<script setup lang="ts">
import type { DevelopersResponse } from '@/api/pocketbase-types';
import { useDeveloper } from '@/composables/todo/developer';
import { useWork } from '@/composables/todo/work';
import router from '@/router';
import dayjs from 'dayjs';
import { onMounted } from 'vue';

const { developers, selectDeveloper, selectDeveloperFullList } = useDeveloper();
const { workArgs, works, selectWorkFullList, createWork, deleteWork, subscribeWorks, doneWork } = useWork();

onMounted(() => {
  selectWorkFullListFilterDeveloper(selectDeveloper.value);
  selectDeveloperFullList();
  subscribeWorks();
});

const onClickCreateWork = async () => {
  await createWork();
  await selectWorkFullList();
};

const onClickSelectDeveoper = (developer: DevelopersResponse | undefined) => {
  selectDeveloper.value = developer;
  selectWorkFullListFilterDeveloper(developer);
};

const selectWorkFullListFilterDeveloper = (developer: DevelopersResponse | undefined) => {
  if (developer) {
    developer = developer as DevelopersResponse;
    selectWorkFullList({
      filter: `done = false && developer = '${developer.id}'`,
    });
  } else {
    selectWorkFullList();
  }
};
</script>
