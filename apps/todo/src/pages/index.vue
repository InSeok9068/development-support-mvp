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
        <template v-for="developer in developers" :key="developer.id">
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
            :aria-invalid="validator.invalid('title')"
            @input="onInputWorkTitle"
            @keydown.stop.prevent.enter="onClickCreateWork"
          />
          <input type="button" value="등록" @click="onClickCreateWork" />
        </fieldset>
        <small v-show="validator.show('title')" class="font-bold">{{ validator.message('title') }}</small>
      </form>
      <VueDraggable
        v-model="works"
        target=".sort-target"
        :touch-start-threshold="3"
        :delay-on-touch-only="true"
        :delay="100"
        @update:model-value="onUpdateWorkList"
        @end="onDropWork"
      >
        <TransitionGroup tag="ul" name="list" class="sort-target">
          <li v-for="work in works" :key="work.id" class="mb-3 sm:mb-5">
            <h6 class="max-w-150 overflow-hidden text-ellipsis whitespace-nowrap">
              <input type="checkbox" @click.stop.prevent="onClickDoneWork(work)" />
              <a class="cursor-pointer" draggable="false" @click="onClickWorkDetail(work.id)">
                {{ work.title }}
              </a>
              <i class="bi-trash ml-3 cursor-pointer" @click="onClickDeleteWork(work)"></i>
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
      </VueDraggable>
    </article>
  </main>
</template>

<script setup lang="ts">
import { Collections, type Create, type DevelopersResponse, type WorksResponse } from '@/api/pocketbase-types';
import { useCode } from '@/composables/code';
import { useRealtime } from '@/composables/realtime';
import { useSetting } from '@/composables/setting';
import { useDeveloper } from '@/composables/todo/developer';
import { useWork } from '@/composables/todo/work';
import { useSign } from '@/composables/user/sign';
import { useValidator } from '@/composables/validator';
import dayjs from 'dayjs';
import { isEmpty } from 'validator';
import { onMounted, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const { selectDeveloper, developers, fetchDeveloperList } = useDeveloper();
const { works, fetchWorkFullList, createWork, updateWork, deleteWork, updateWorkSortBatch, setWorksCache } = useWork();
const { subscribeRealtime } = useRealtime<WorksResponse>(Collections.Works);
const { getUserId } = useSign();
const { getCodeDesc, getCodeClass } = useCode();
const { setting } = useSetting();
const validator = useValidator([
  {
    key: 'title',
    validate: (value) => !isEmpty(String(value ?? '')),
    message: '최소 1자리 이상 입력해주세요.',
  },
]);
const router = useRouter();
const workArgs = ref<Create<Collections.Works>>({
  id: '',
  user: getUserId(),
  title: '',
  time: 0,
  state: 'wait',
  done: false,
  developer: '',
  content: `<p></p><p></p><p></p><p></p><p></p>`,
});
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  fetchWorkFullListFilterDeveloper(selectDeveloper.value);
  fetchDeveloperList();
  subscribeWorks();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickCreateWork = async () => {
  if (validator.validateForm('workArgsForm')) {
    await createWork(workArgs.value);
    await fetchWorkFullList();
    workArgs.value.title = '';
    validator.clearFields(['title']);
  }
};

const onInputWorkTitle = () => {
  validator.validateField('title', workArgs.value.title);
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

const onDropWork = async () => {
  const nextWorks = works.value.map((work, index) => ({ ...work, sort: index }));
  setWorksCache(() => nextWorks);
  await updateWorkSortBatch(nextWorks);
};

const onUpdateWorkList = (next: WorksResponse[]) => {
  setWorksCache(() => [...next]);
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

const onClickSort = async () => {
  // works.value = works.value.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const sorted = [...works.value].sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate) : null;
    const bDate = b.dueDate ? new Date(b.dueDate) : null;
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return aDate.getTime() - bDate.getTime();
  });

  const sortedWorks = sorted.map((work, index) => ({ ...work, sort: index }));
  setWorksCache(() => sortedWorks);
  await updateWorkSortBatch(sortedWorks);
};

const onClickWorkDetail = (id: string) => {
  router.push(`/detail/${id}`);
};

const subscribeWorks = async () => {
  await subscribeRealtime((e) => {
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
