<template>
  <main class="container mx-auto px-3 py-4 lg:px-4">
    <sl-card class="w-full shadow-sm">
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 class="font-semibold tracking-tight">오늘의 업무</h4>
            <div class="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span :class="{ 'font-semibold text-red-500': works.length > 10, 'animate-pulse': works.length > 10 }">
                현재 {{ works.length }}개
              </span>
              <span class="hidden sm:inline">관리되고 있는 TODO가 10개가 넘지 않도록!!</span>
            </div>
          </div>
          <sl-button variant="default" size="small" @click="onClickSort">
            <sl-icon name="sort-up" class="mr-2"></sl-icon>
            마감일자 순 재정렬
          </sl-button>
        </div>

        <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>담당자 필터</span>
            <span>{{ developers.length }}명</span>
          </div>
          <sl-button-group class="w-full">
            <sl-button
              class="w-full"
              :variant="selectDeveloper !== 'ALL' ? 'default' : 'primary'"
              @click="onClickSelectDeveloper('ALL')"
            >
              ALL
            </sl-button>
            <sl-button
              class="w-full"
              :variant="selectDeveloper !== '' ? 'default' : 'primary'"
              @click="onClickSelectDeveloper('')"
            >
              미배정
            </sl-button>
            <template v-for="developer in developers" :key="developer.id">
              <sl-button
                class="w-full"
                :variant="(selectDeveloper as DevelopersResponse)?.id !== developer.id ? 'default' : 'primary'"
                @click="onClickSelectDeveloper(developer)"
              >
                {{ developer.name }}
              </sl-button>
            </template>
          </sl-button-group>
        </div>

        <form
          id="workArgsForm"
          class="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <sl-input
              v-model="workArgs.title"
              class="w-full"
              name="title"
              placeholder="할 일을 입력하세요"
              :aria-invalid="validator.invalid('title')"
              @input="onInputWorkTitle"
              @keydown.stop.prevent.enter="onClickCreateWork"
            />
            <sl-button class="w-full sm:w-28" variant="primary" type="button" @click="onClickCreateWork">
              등록
            </sl-button>
          </div>
          <small v-show="validator.show('title')" class="font-bold text-red-500">
            {{ validator.message('title') }}
          </small>
        </form>
      </div>
      <VueDraggable
        v-model="works"
        target=".sort-target"
        :touch-start-threshold="3"
        :delay-on-touch-only="true"
        :delay="100"
        @update:model-value="onUpdateWorkList"
        @end="onDropWork"
      >
        <TransitionGroup tag="ul" name="list" class="sort-target mt-4">
          <li
            v-for="(work, index) in works"
            :key="work.id"
            class="rounded-lg border bg-white px-4 py-3 shadow-sm transition hover:shadow dark:bg-slate-900"
            :class="buildWorkCardClass(work, index)"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex items-center gap-3">
                  <sl-checkbox @click.stop.prevent="onClickDoneWork(work)"></sl-checkbox>
                  <h6 class="max-w-150 overflow-hidden font-semibold text-ellipsis whitespace-nowrap">
                    <a class="cursor-pointer" draggable="false" @click="onClickWorkDetail(work.id)">
                      {{ work.title }}
                    </a>
                  </h6>
                </div>
                <div
                  class="mt-2 grid gap-y-2 text-xs text-slate-600 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_11rem_11rem] dark:text-slate-300"
                >
                  <div class="grid grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-2">
                    <span class="min-w-15 font-semibold text-slate-500 dark:text-slate-400">개발자</span>
                    <span class="min-w-0 text-right">
                      {{ getDeveloperName(work.developer) }}
                    </span>
                  </div>
                  <div class="grid grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-2">
                    <span class="min-w-15 font-semibold text-slate-500 dark:text-slate-400">상태</span>
                    <span class="inline-flex min-w-0 items-center justify-end gap-1">
                      <sl-icon v-show="getWorkStateClass(work.state)" :name="getWorkStateClass(work.state)"> </sl-icon>
                      <span class="truncate">{{ getWorkStateDesc(work.state) }}</span>
                    </span>
                  </div>
                  <div class="hidden grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-2 sm:grid">
                    <span class="min-w-15 font-semibold text-slate-500 dark:text-slate-400">등록일자</span>
                    <span class="text-right">{{ dayjs(work.created).format('YYYY-MM-DD') }}</span>
                  </div>
                  <div
                    class="grid grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-2"
                    :class="{
                      'animate-pulse font-bold text-red-500': isUrgentWork(work),
                    }"
                  >
                    <span class="min-w-15 font-semibold text-slate-500 dark:text-slate-400">마감일자</span>
                    <span class="text-right">{{ work.dueDate ? dayjs(work.dueDate).format('YYYY-MM-DD') : '-' }}</span>
                  </div>
                </div>
              </div>
              <sl-button size="small" variant="text" @click="onClickDeleteWork(work)">
                <sl-icon name="trash" class="text-slate-500 dark:text-slate-400"></sl-icon>
              </sl-button>
            </div>
          </li>
        </TransitionGroup>
      </VueDraggable>
    </sl-card>
  </main>
</template>

<script setup lang="ts">
import { Collections, type Create, type DevelopersResponse, type WorksResponse } from '@/api/pocketbase-types';
import { useCode } from '@/composables/code';
import { useSetting } from '@/composables/setting';
import { useDeveloper } from '@/composables/todo/developer';
import { useWork } from '@/composables/todo/work';
import { useSign } from '@/composables/user/sign';
import { useValidator } from '@/composables/validator';
import { readShoelaceSingleValue, useModal } from '@packages/ui';
import dayjs from 'dayjs';
import { isEmpty } from 'validator';
import { onMounted, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const { selectDeveloper, developers, fetchDeveloperList } = useDeveloper();
const {
  works,
  fetchWorkFullList,
  createWork,
  updateWork,
  deleteWork,
  updateWorkSortBatch,
  setWorksCache,
  subscribeWorksRealtime,
} = useWork();
const { getUserId } = useSign();
const { getCodeDesc, getCodeClass } = useCode();
const { setting } = useSetting();
const { showConfirmModal } = useModal();
const validator = useValidator([
  {
    key: 'title',
    validate: (value) => !isEmpty(String(value)),
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

const onInputWorkTitle = (event: Event) => {
  validator.validateField('title', readShoelaceSingleValue(event));
};

const onClickSelectDeveloper = (developer: DevelopersResponse | string) => {
  selectDeveloper.value = developer;
  fetchWorkFullListFilterDeveloper(developer);
};

const isUrgentWork = (work: WorksResponse) => {
  if (!work.dueDate) {
    return false;
  }

  return dayjs(work.dueDate).isBefore(dayjs().add(setting.value.daysBefore, 'd'));
};

const getDeveloperName = (developerId: string | undefined) =>
  developers.value.find((developer: DevelopersResponse) => developer.id === developerId)?.name ?? '-';

const getWorkStateClass = (state: string | undefined) => getCodeClass('workState', state ?? '') ?? '';

const getWorkStateDesc = (state: string | undefined) => getCodeDesc('workState', state ?? '') ?? '-';

const buildWorkCardClass = (work: WorksResponse, index: number) => {
  const urgent = isUrgentWork(work);
  return {
    'mt-3 sm:mt-4': index > 0,
    'border-slate-200 dark:border-slate-700': !urgent,
    'border-red-400 dark:border-red-500': urgent,
  };
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

const onClickDeleteWork = (work: WorksResponse) => {
  showConfirmModal({
    title: '삭제 확인',
    message: '해당 업무를 삭제할까요?',
    onConfirm: async () => {
      await deleteWork(work);
    },
  });
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
  await subscribeWorksRealtime((e) => {
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
