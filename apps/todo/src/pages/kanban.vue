<template>
  <main class="container">
    <div class="grid">
      <template v-for="code in workStateCodesStep1" :key="code.value">
        <VueDraggable
          group="works"
          target=".sort-target-1"
          :model-value="getWorksByState(code.value)"
          :touch-start-threshold="3"
          :delay-on-touch-only="true"
          :delay="100"
          :animation="300"
          @add="onAddWork($event, code.value)"
          @update:model-value="onUpdateWorkList(code.value, $event)"
        >
          <TransitionGroup tag="article" name="list" class="sort-target-1 overflow-auto md:max-h-200 md:min-h-200">
            <h4>
              <i class="mr-1" :class="code.class"></i>
              {{ code.desc }}
            </h4>
            <template v-for="work in getWorksByState(code.value)" :key="work.id">
              <article class="p-3" :data-id="work.id">
                <a class="cursor-pointer text-sm font-semibold" @click.stop.prevent="onClickWorkDetail(work.id)">
                  {{ work.title }}
                </a>
                <hr />
                <p class="text-sm">
                  개발자 :
                  {{ developers.find((developer: DevelopersResponse) => developer.id === work.developer)?.name }}
                </p>
                <p
                  v-show="work.dueDate"
                  class="text-sm"
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
                </p>
              </article>
            </template>
          </TransitionGroup>
        </VueDraggable>
      </template>
    </div>
    <hr />
    <div class="grid">
      <template v-for="code in workStateCodesStep2" :key="code.value">
        <VueDraggable
          group="works"
          target=".sort-target-2"
          :model-value="getWorksByState(code.value)"
          :touch-start-threshold="3"
          :delay-on-touch-only="true"
          :delay="100"
          :animation="300"
          @add="onAddWork($event, code.value)"
          @update:model-value="onUpdateWorkList(code.value, $event)"
        >
          <TransitionGroup tag="article" name="list" class="sort-target-2 overflow-auto md:max-h-200 md:min-h-200">
            <h4>
              <i class="mr-1" :class="code.class"></i>
              {{ code.desc }}
            </h4>
            <template v-for="work in getWorksByState(code.value)" :key="work.id">
              <article class="p-3" :data-id="work.id">
                <a class="cursor-pointer text-sm font-semibold" @click.stop.prevent="onClickWorkDetail(work.id)">
                  {{ work.title }}
                </a>
                <hr />
                <p class="text-sm">
                  개발자 :
                  {{ developers.find((developer: DevelopersResponse) => developer.id === work.developer)?.name }}
                </p>
                <p
                  class="text-sm"
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
                </p>
              </article>
            </template>
          </TransitionGroup>
        </VueDraggable>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { DevelopersResponse, WorksResponse } from '@/api/pocketbase-types.ts';
import { useCode } from '@/composables/code.ts';
import { useSetting } from '@/composables/setting.ts';
import { useDeveloper } from '@/composables/todo/developer.ts';
import { useWork } from '@/composables/todo/work.ts';
import dayjs from 'dayjs';
import { computed, onMounted } from 'vue';
import { type DraggableEvent, VueDraggable } from 'vue-draggable-plus';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const { works, fetchWorkFullList, updateWork, setWorksCache, subscribeWorks: requestSubscribe } = useWork();
const { developers, fetchDeveloperList } = useDeveloper();
const { getCodesByType } = useCode();
const { setting } = useSetting();
const workStateCodesStep1 = computed(() => getCodesByType('workState').slice(0, 3));
const workStateCodesStep2 = computed(() => getCodesByType('workState').slice(3, 6));
const router = useRouter();
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(async () => {
  await fetchWorkFullList();
  await fetchDeveloperList();
  await subscribeWorks();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickWorkDetail = (id: string) => {
  router.push(`/detail/${id}`);
};

const getWorksByState = (state: string) => works.value.filter((item) => item.state === state);

const onUpdateWorkList = (state: string, next: WorksResponse[]) => {
  setWorksCache((current) => {
    const nextWithState = next.map((item) => (item.state === state ? item : { ...item, state }));
    const nextIds = new Set(nextWithState.map((item) => item.id));
    const keep = current.filter((item) => !nextIds.has(item.id) && item.state !== state);
    return [...keep, ...nextWithState];
  });
};

const onAddWork = async (event: DraggableEvent, state: string) => {
  const workId = event.item?.dataset?.id;
  if (!workId) return;

  await updateWork(workId, {
    state,
  });

  await fetchWorkFullList();
};

const subscribeWorks = async () => {
  await requestSubscribe((e) => {
    switch (e.action) {
      case 'update':
        if (e.record.done) {
          setWorksCache((current) => current.filter((item) => item.id !== e.record.id));
        }
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
  transform: translateY(30px);
}
</style>
