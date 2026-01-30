<template>
  <main class="container">
    <div class="grid">
      <template v-for="code in workStateCodesStep1">
        <!-- eslint-disable-next-line vue/valid-v-for -->
        <TransitionGroup
          tag="article"
          name="list"
          class="overflow-auto md:max-h-200 md:min-h-200"
          @dragover.prevent
          @drop.prevent="onDropWork($event, code.value)"
        >
          <h4>
            <i class="mr-1" :class="code.class"></i>
            {{ code.desc }}
          </h4>
          <template v-for="work in works.filter((val) => val.state === code.value)">
            <article
              class="p-3"
              draggable="true"
              @dragstart="onDragStartWork($event, work.id)"
              @drop.prevent="onDropWork($event, code.value)"
              @dragover.prevent
            >
              <a class="cursor-pointer text-sm font-semibold" @click.stop.prevent="router.push(`/detail/${work.id}`)">
                {{ work.title }}
              </a>
              <hr />
              <p class="text-sm">
                개발자 : {{ developers.find((developer: DevelopersResponse) => developer.id === work.developer)?.name }}
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
      </template>
    </div>
    <hr />
    <div class="grid">
      <template v-for="code in workStateCodesStep2">
        <!-- eslint-disable-next-line vue/valid-v-for -->
        <TransitionGroup
          tag="article"
          name="list"
          class="overflow-auto md:max-h-200 md:min-h-200"
          @dragover.prevent
          @drop.prevent="onDropWork($event, code.value)"
        >
          <h4>
            <i class="mr-1" :class="code.class"></i>
            {{ code.desc }}
          </h4>
          <template v-for="work in works.filter((val) => val.state === code.value)">
            <article
              class="p-3"
              draggable="true"
              @dragstart="onDragStartWork($event, work.id)"
              @drop.prevent="onDropWork($event, code.value)"
              @dragover.prevent
            >
              <a class="cursor-pointer text-sm font-semibold" @click.stop.prevent="router.push(`/detail/${work.id}`)">
                {{ work.title }}
              </a>
              <hr />
              <p class="text-sm">
                개발자 : {{ developers.find((developer: DevelopersResponse) => developer.id === work.developer)?.name }}
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
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { DevelopersResponse } from '@/api/pocketbase-types.ts';
import { useCode } from '@/composables/code.ts';
import { useSetting } from '@/composables/setting.ts';
import { useDeveloper } from '@/composables/todo/developer.ts';
import { useWork } from '@/composables/todo/work.ts';
import dayjs from 'dayjs';
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const {
  works,
  fetchWorkFullList,
  updateWork,
  setWorksCache,
  subscribeWorks: requestSubscribe,
  unsubscribeWorks: requestUnsubscribe,
} = useWork();
const { developers, fetchDeveloperList } = useDeveloper();
const { getCodesByType } = useCode();
const { setting } = useSetting();
const workStateCodesStep1 = computed(() => getCodesByType('workState').slice(0, 3));
const workStateCodesStep2 = computed(() => getCodesByType('workState').slice(3, 6));
const router = useRouter();
let unsubscribeWorks: (() => void | Promise<void>) | null = null;
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(async () => {
  await fetchWorkFullList();
  await fetchDeveloperList();
  await subscribeWorks();
});

onBeforeUnmount(async () => {
  if (unsubscribeWorks) {
    await unsubscribeWorks();
    unsubscribeWorks = null;
  } else {
    await requestUnsubscribe();
  }
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onDragStartWork = (event: DragEvent, id: string) => {
  event.dataTransfer?.setData('transId', id);
};

const onDropWork = async (event: DragEvent, state: string) => {
  const transId = event.dataTransfer?.getData('transId') as string;

  await updateWork(transId, {
    state,
  });

  await fetchWorkFullList();
};

const subscribeWorks = async () => {
  unsubscribeWorks = await requestSubscribe((e) => {
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
