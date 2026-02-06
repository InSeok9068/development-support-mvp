<template>
  <main class="container mx-auto">
    <sl-card class="w-full">
      <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-lg font-semibold">칸반 보드</h3>
          <sl-tag size="small" variant="neutral">실시간 업무 흐름</sl-tag>
        </div>
        <div class="text-xs text-slate-500">드래그로 상태 이동</div>
      </div>

      <section class="flex flex-col gap-6">
        <div class="flex flex-col gap-4 md:flex-row md:pb-2">
          <template v-for="code in workStateCodesStep1" :key="code.value">
            <sl-card class="w-full md:min-w-0 md:flex-1">
              <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
              <div slot="header">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i class="text-base" :class="code.class"></i>
                    <span class="text-sm font-semibold">{{ code.desc }}</span>
                  </div>
                  <sl-badge pill>
                    {{ getWorksByState(code.value).length }}
                  </sl-badge>
                </div>
              </div>
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
                <TransitionGroup
                  tag="div"
                  name="list"
                  class="sort-target-1 flex flex-col gap-3 md:max-h-200 md:min-h-200 md:overflow-auto"
                >
                  <template v-for="work in getWorksByState(code.value)" :key="work.id">
                    <sl-card class="cursor-pointer" :data-id="work.id">
                      <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                          <a class="block text-sm font-semibold" @click.stop.prevent="onClickWorkDetail(work.id)">
                            {{ work.title }}
                          </a>
                          <div class="mt-2 text-xs text-slate-600">
                            개발자 :
                            {{
                              developers.find((developer: DevelopersResponse) => developer.id === work.developer)?.name
                            }}
                          </div>
                          <div
                            v-show="work.dueDate"
                            class="mt-2 text-xs"
                            :class="{
                              'animate-pulse font-bold text-red-500': dayjs(work.dueDate).isBefore(
                                dayjs().add(setting.daysBefore, 'd'),
                              ),
                            }"
                          >
                            마감일자 :
                            <sl-tag size="small">
                              {{ work.dueDate && dayjs(work.dueDate).format('YYYY-MM-DD') }}
                            </sl-tag>
                          </div>
                        </div>
                        <sl-icon name="grip-vertical" class="text-slate-400"></sl-icon>
                      </div>
                    </sl-card>
                  </template>
                  <div
                    v-if="getWorksByState(code.value).length === 0"
                    :key="`empty-${code.value}`"
                    class="py-6 text-center text-xs text-slate-400"
                  >
                    아직 할 일이 없습니다
                  </div>
                </TransitionGroup>
              </VueDraggable>
            </sl-card>
          </template>
        </div>

        <div class="flex flex-col gap-4 md:flex-row md:pb-2">
          <template v-for="code in workStateCodesStep2" :key="code.value">
            <sl-card class="w-full md:min-w-0 md:flex-1">
              <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
              <div slot="header">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i class="text-base" :class="code.class"></i>
                    <span class="text-sm font-semibold">{{ code.desc }}</span>
                  </div>
                  <sl-badge pill>
                    {{ getWorksByState(code.value).length }}
                  </sl-badge>
                </div>
              </div>
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
                <TransitionGroup
                  tag="div"
                  name="list"
                  class="sort-target-2 flex flex-col gap-3 md:max-h-200 md:min-h-200 md:overflow-auto"
                >
                  <template v-for="work in getWorksByState(code.value)" :key="work.id">
                    <sl-card class="cursor-pointer" :data-id="work.id">
                      <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                          <a class="block text-sm font-semibold" @click.stop.prevent="onClickWorkDetail(work.id)">
                            {{ work.title }}
                          </a>
                          <div class="mt-2 text-xs text-slate-600">
                            개발자 :
                            {{
                              developers.find((developer: DevelopersResponse) => developer.id === work.developer)?.name
                            }}
                          </div>
                          <div
                            v-show="work.dueDate"
                            class="mt-2 text-xs"
                            :class="{
                              'animate-pulse font-bold text-red-500': dayjs(work.dueDate).isBefore(
                                dayjs().add(setting.daysBefore, 'd'),
                              ),
                            }"
                          >
                            마감일자 :
                            <sl-tag size="small">
                              {{ work.dueDate && dayjs(work.dueDate).format('YYYY-MM-DD') }}
                            </sl-tag>
                          </div>
                        </div>
                        <sl-icon name="grip-vertical" class="text-slate-400"></sl-icon>
                      </div>
                    </sl-card>
                  </template>
                  <div
                    v-if="getWorksByState(code.value).length === 0"
                    :key="`empty-${code.value}`"
                    class="py-6 text-center text-xs text-slate-400"
                  >
                    아직 할 일이 없습니다
                  </div>
                </TransitionGroup>
              </VueDraggable>
            </sl-card>
          </template>
        </div>
      </section>
    </sl-card>
  </main>
</template>

<script setup lang="ts">
import { Collections, type DevelopersResponse, type WorksResponse } from '@/api/pocketbase-types.ts';
import { useCode } from '@/composables/code.ts';
import { useRealtime } from '@/composables/realtime.ts';
import { useSetting } from '@/composables/setting.ts';
import { useDeveloper } from '@/composables/todo/developer.ts';
import { useWork } from '@/composables/todo/work.ts';
import dayjs from 'dayjs';
import { computed, onMounted } from 'vue';
import { type DraggableEvent, VueDraggable } from 'vue-draggable-plus';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const { works, fetchWorkFullList, updateWork, setWorksCache } = useWork();
const { subscribeRealtime } = useRealtime<WorksResponse>(Collections.Works);
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
  await subscribeRealtime((e) => {
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
