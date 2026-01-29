<template>
  <main class="container">
    <article>
      <div class="grid grid-cols-[auto_auto_1fr_auto]">
        <h5 class="font-bold text-red-500">관리되고 있는 TODO가 10개가 넘지 않도록!!</h5>
        <h5 :class="{ 'animate-pulse': works.length > 10 }">현재 {{ works.length }}개</h5>
        <div></div>
        <h6>
          <i class="bi-sort-up cursor-pointer" @click="onClickSort"> 마감일자 순 재정렬 </i>
        </h6>
      </div>

      <div class="mb-3 flex gap-2">
        <button class="w-full" :class="{ outline: selectDeveloper !== 'ALL' }" @click="onClickSelectDeveloper('ALL')">
          ALL
        </button>
        <button class="w-full" :class="{ outline: selectDeveloper !== '' }" @click="onClickSelectDeveloper('')">
          미배정
        </button>
        <template v-for="developer in developers">
          <button
            class="w-full"
            :class="{ outline: (selectDeveloper as DevelopersResponse)?.id !== developer.id }"
            @click="onClickSelectDeveloper(developer)"
          >
            {{ developer.name }}
          </button>
        </template>
      </div>

      <form id="workArgsForm">
        <fieldset role="group">
          <input
            v-model="workArgs.title"
            name="title"
            :aria-invalid="validators.invalid('title')"
            @keyup="validators.valid('title', workArgs.title)"
            @keydown.stop.prevent.enter="onClickCreateWork"
          />
          <input type="button" value="등록" @click="onClickCreateWork" />
        </fieldset>
        <small v-show="validators.showMessage('title')" class="font-bold">{{ validators.getMessage('title') }}</small>
      </form>
      <TransitionGroup tag="ul" name="list">
        <li
          v-for="(work, index) in works"
          :key="work.id"
          class="mb-3 sm:mb-5"
          draggable="true"
          @drop.prevent="onDropWork($event, index)"
          @dragstart="onDragStartWork($event, index)"
          @dragover.prevent
        >
          <h6 class="max-w-150 overflow-hidden text-ellipsis whitespace-nowrap">
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
            <label class="hidden sm:block">
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
      </TransitionGroup>
    </article>
  </main>
</template>

<script setup lang="ts">
import pb from '@/api/pocketbase';
import type { Collections, Create, DevelopersResponse, WorksResponse } from '@/api/pocketbase-types';
import { useCode } from '@/composables/code';
import { useSetting } from '@/composables/setting';
import { useDeveloper } from '@/composables/todo/developer';
import { useWork } from '@/composables/todo/work';
import { useValidator } from '@/composables/validator';
import dayjs from 'dayjs';
import { isEmpty } from 'validator';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const { selectDeveloper, developers, fetchDevelopers } = useDeveloper();
const { works, fetchWorkFullList, createWork, updateWork, deleteWork, setWorksCache } = useWork();
const { getCodeDesc, getCodeClass } = useCode();
const { setting } = useSetting();
const { validators } = useValidator();
const router = useRouter();
const workArgs = ref<Create<Collections.Works>>({
  id: '',
  user: pb.authStore.record?.id ?? '',
  title: '',
  time: 0,
  state: 'wait',
  done: false,
  developer: '',
  content: `<p></p><p></p><p></p><p></p><p></p>`,
});
validators.value.schema = [
  {
    key: 'title',
    valid: (value) => !isEmpty(value as string),
    message: '최소 1자리 이상 입력해주세요.',
  },
];
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  fetchWorkFullListFilterDeveloper(selectDeveloper.value);
  fetchDevelopers();
  subscribeWorks();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickCreateWork = async () => {
  if (validators.value.validAll('workArgsForm')) {
    await createWork(workArgs.value);
    await fetchWorkFullList();
    workArgs.value.title = '';
  }
};

const onClickSelectDeveloper = (developer: DevelopersResponse | string) => {
  selectDeveloper.value = developer;
  fetchWorkFullListFilterDeveloper(developer);
};

const fetchWorkFullListFilterDeveloper = (developer: DevelopersResponse | string | undefined) => {
  if (developer === 'ALL') {
    fetchWorkFullList();
  } else if (developer === '') {
    fetchWorkFullList({
      filter: `done = false && developer = ''`,
    });
  } else if (developer) {
    developer = developer as DevelopersResponse;
    fetchWorkFullList({
      filter: `done = false && developer = '${developer.id}'`,
    });
  } else {
    fetchWorkFullList();
  }
};

const onDragStartWork = (event: DragEvent, curIndex: number) => {
  event.dataTransfer?.setData('transIndex', String(curIndex));
};

const onDropWork = (event: DragEvent, curIndex: number) => {
  const transIndex = Number(event.dataTransfer?.getData('transIndex'));

  setWorksCache((current) => {
    const next = [...current];
    const [el] = next.splice(transIndex, 1);
    next.splice(curIndex, 0, el);
    return next.map((item, index) => ({ ...item, sort: index }));
  });

  works.value.forEach((work, index) => {
    updateWork(work.id, { sort: index }, { invalidateWorks: false, invalidateWork: false });
  });
};

const onClickDoneWork = async (work: WorksResponse) => {
  await updateWork(work.id, {
    ...work,
    done: true,
    state: 'done',
    doneDate: new Date(),
  });
};

const onClickDeleteWork = async (work: WorksResponse) => {
  await deleteWork(work);
};

const onClickSort = () => {
  // works.value = works.value.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const sorted = [...works.value].sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate) : null;
    const bDate = b.dueDate ? new Date(b.dueDate) : null;
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return aDate.getTime() - bDate.getTime();
  });

  setWorksCache(() => sorted);

  works.value.forEach((work, index) => {
    updateWork(work.id, { sort: index }, { invalidateWorks: false, invalidateWork: false });
  });
};

const subscribeWorks = async () => {
  await pb.collection('works').subscribe('*', (e) => {
    switch (e.action) {
      case 'create':
        setWorksCache((current) => [...current, e.record]);
        break;
      case 'update':
        if (e.record.done) {
          setWorksCache((current) => current.filter((item) => item.id !== e.record.id));
        }
        break;
      case 'delete':
        setWorksCache((current) => current.filter((item) => item.id !== e.record.id));
        break;
    }
  });
};
/* ======================= 메서드 ======================= */
</script>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.25s var(--ease-1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
