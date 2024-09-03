<template>
  <main class="container">
    <article>
      <div class="grid">
        <h5 class="text-red-500">관리되고 있는 TODO가 10개가 넘지 않도록!!</h5>
        <h5 :class="{ 'animate-pulse': works.length > 10 }">현재 {{ works.length }}개</h5>
      </div>

      <div class="mb-3 grid">
        <button :class="{ outline: selectDeveloper !== 'ALL' }" @click="onClickSelectDeveloper('ALL')">ALL</button>
        <button :class="{ outline: selectDeveloper !== '' }" @click="onClickSelectDeveloper('')">미배정</button>
        <template v-for="developer in developers">
          <button
            :class="{ outline: (selectDeveloper as DevelopersResponse)?.id !== developer.id }"
            @click="onClickSelectDeveloper(developer)"
          >
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
            <input type="checkbox" @click.stop.prevent="onClickDoneWork(work)" />
            <a class="cursor-pointer" @click="router.push(`/detail/${work.id}`)">
              {{ work.title }}
            </a>
            <i class="bi bi-trash ml-3 cursor-pointer" @click="onClickDeleteWork(work)"></i>
          </h6>

          <div class="grid">
            <label>
              개발자 :
              <span>
                {{ developers.find((developer: DevelopersResponse) => developer.id === work.developer)?.name }}
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
            <label
              :class="{
                'animate-pulse font-bold text-red-500': dayjs(work.dueDate).isBefore(
                  dayjs().add(setting.daysBefore, 'd'),
                ),
              }"
            >
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
import pb from '@/api/pocketbase';
import type { DevelopersResponse, WorksRecord, WorksResponse } from '@/api/pocketbase-types';
import { useCode } from '@/composables/code';
import { useSetting } from '@/composables/setting';
import { useDeveloper } from '@/composables/todo/developer';
import { useWork } from '@/composables/todo/work';
import router from '@/router';
import dayjs from 'dayjs';
import { onMounted, ref } from 'vue';

/* ======================= 변수 ======================= */
const { selectDeveloper, developers, selectDeveloperFullList } = useDeveloper();
const { works, selectWorkFullList, deleteWork } = useWork();
const { getCodeDesc, getCodeClass } = useCode();
const { setting } = useSetting();
const workArgs = ref<WorksRecord>({
  user: pb.authStore.model?.id,
  title: '',
  time: 0,
  state: 'wait',
  done: false,
  developer: '',
  contentBoxHeight: 400,
});
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  selectWorkFullListFilterDeveloper(selectDeveloper.value);
  selectDeveloperFullList();
  subscribeWorks();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickCreateWork = async () => {
  await pb.collection('works').create(workArgs.value);
  await selectWorkFullList();
  workArgs.value.title = '';
};

const onClickSelectDeveloper = (developer: DevelopersResponse | string) => {
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
    pb.collection('works').update(work.id, work);
  });
};

const onClickDoneWork = async (work: WorksResponse) => {
  await pb.collection('works').update(work.id, {
    ...work,
    done: true,
    state: 'done',
    doneDate: new Date(),
  });
};

const onClickDeleteWork = async (work: WorksResponse) => {
  await deleteWork(work);
};

const subscribeWorks = async () => {
  await pb.collection('works').subscribe('*', (e) => {
    switch (e.action) {
      case 'create':
        works.value.push(e.record);
        break;
      case 'update':
        if (e.record.done) {
          works.value = works.value.filter((i) => i.id !== e.record.id);
        }
        break;
      case 'delete':
        works.value = works.value.filter((i) => i.id !== e.record.id);
        break;
    }
  });
};
/* ======================= 메서드 ======================= */
</script>
