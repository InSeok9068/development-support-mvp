<template>
  <main class="container">
    <article>
      <h5 style="color: red">관리되고 있는 TODO가 10개가 넘지 않도록!!</h5>
      <div role="group">
        <button class="outline contrast" @click="selectWorkList()">ALL</button>
        <template v-for="developer in developers">
          <button class="outline contrast" @click="selectWorkList(developer)">
            <span>{{ developer.name }}</span>
          </button>
        </template>
      </div>
      <fieldset role="group">
        <input name="title" v-model="workArgs.title" @keydown.enter="createWork() && selectWorkList()" />
        <input type="button" value="등록" @click="createWork() && selectWorkList()" />
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

<script setup>
import { useDeveloper } from '@/composables/developer';
import { useWork } from '@/composables/work';
import router from '@/router';
import dayjs from 'dayjs';
import { onMounted } from 'vue';
const { developers, selectDeveloperList } = useDeveloper();
const { workArgs, works, selectWorkList, createWork, deleteWork, subscribeWorks, doneWork } = useWork();

onMounted(() => {
  selectWorkList();
  selectDeveloperList();
  subscribeWorks();
});
</script>
