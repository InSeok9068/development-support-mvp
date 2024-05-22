<template>
  <main class="container">
    <article>
      <div class="grid">
        <h5 class="red">관리되고 있는 TODO가 10개가 넘지 않도록!!</h5>
        <h5 :class="{ blink: works.length > 10 }">현재 {{ works.length }}개</h5>
      </div>

      <div role="group">
        <button :class="{ outline: selectDeveloper !== 'ALL' }" @click="onClickSelectDeveoper('ALL')">ALL</button>
        <button :class="{ outline: selectDeveloper !== '' }" @click="onClickSelectDeveoper('')">미배정</button>
        <template v-for="developer in developers">
          <button
            :class="{ outline: (selectDeveloper as DevelopersResponse)?.id !== developer.id }"
            @click="onClickSelectDeveoper(developer)"
          >
            <!-- <i v-if="developer.isLeader" class="bi bi-star"></i> -->
            {{ developer.name }}
          </button>
        </template>
      </div>

      <fieldset role="group">
        <input v-model="workArgs.title" name="title" @keydown.stop.prevent.enter="onClickCreateWork" />
        <input type="button" value="등록" @click="onClickCreateWork" />
      </fieldset>

      <ul v-for="(work, index) in works">
        <li
          draggable="true"
          @drop.prevent="onDropWork($event, index)"
          @dragstart="onDragStartWork($event, index)"
          @dragover.prevent
        >
          <h6>
            <input type="checkbox" @click.stop.prevent="doneWork(work)" />
            <a class="cursor-pointer" @click="router.push(`/detail/${work.id}`)">
              {{ work.title }}
            </a>
            <i class="bi bi-trash cursor-pointer ml-10" @click="deleteWork(work)"></i>
          </h6>

          <div class="grid">
            <label>
              개발자 :
              <span>
                {{ developers.find((developer) => developer.id === work.developer)?.name }}
              </span>
            </label>
            <label>
              상태 :
              <span>
                <i :class="getCodeClass('workState', work.state)"></i>
                {{ getCodeDesc('workState', work.state) }}
              </span>
            </label>
            <label>
              등록일자 :
              <span>
                {{ dayjs(work.created).format('YYYY-MM-DD') }}
              </span>
            </label>
            <label :class="{ blink: dayjs(work.dueDate).isBefore(dayjs().add(setting.daysBefore, 'd')) }">
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
import { useCode } from '@/composables/code';
import { useSetting } from '@/composables/setting';
import { useDeveloper } from '@/composables/todo/developer';
import { useWork } from '@/composables/todo/work';
import router from '@/router';
import dayjs from 'dayjs';
import { onMounted } from 'vue';

const { developers, selectDeveloper, selectDeveloperFullList } = useDeveloper();
const { workArgs, works, selectWorkFullList, createWork, deleteWork, subscribeWorks, doneWork, updateWorkBySort } =
  useWork();
const { getCodeDesc, getCodeClass } = useCode();
const { setting } = useSetting();

onMounted(() => {
  selectWorkFullListFilterDeveloper(selectDeveloper.value);
  selectDeveloperFullList();
  subscribeWorks();
});

const onClickCreateWork = async () => {
  await createWork();
  await selectWorkFullList();
};

const onClickSelectDeveoper = (developer: DevelopersResponse | string) => {
  selectDeveloper.value = developer;
  selectWorkFullListFilterDeveloper(developer);
};

const selectWorkFullListFilterDeveloper = (developer: DevelopersResponse | string | undefined) => {
  if (developer === 'ALL') {
    selectWorkFullList();
  } else if (developer === '') {
    selectWorkFullList({
      filter: `done = false && developer = ''`,
    });
  } else if (developer) {
    developer = developer as DevelopersResponse;
    selectWorkFullList({
      filter: `done = false && developer = '${developer.id}'`,
    });
  } else {
    selectWorkFullList();
  }
};

const onDragStartWork = (event: DragEvent, curIndex: number) => {
  event.dataTransfer?.setData('transIndex', String(curIndex));
};

const onDropWork = (event: DragEvent, curIndex: number) => {
  const transIndex = Number(event.dataTransfer?.getData('transIndex'));

  const [el] = works.value.splice(transIndex, 1);
  works.value.splice(curIndex, 0, el);

  works.value.forEach((work, index) => {
    work.sort = index;
    updateWorkBySort(work);
  });
};
</script>

<style scoped>
.red {
  color: red;
}

.ml-10 {
  margin-left: 10px;
}
</style>
