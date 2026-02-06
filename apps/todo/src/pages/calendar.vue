<template>
  <main class="container mx-auto">
    <sl-card class="w-full">
      <div class="mb-4">
        <h4 class="font-semibold">캘린더</h4>
        <div class="text-xs text-slate-500">마감 일정과 이벤트를 확인하세요</div>
      </div>
      <div class="h-[70vh] min-h-140">
        <FullCalendar ref="calendarRef" class="h-full" :options="calendarOption" />
      </div>
    </sl-card>
  </main>
</template>

<script setup lang="ts">
import { useWork } from '@/composables/todo/work';
import type { CalendarOptions, EventClickArg, EventMountArg } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction/index.js';
import FullCalendar from '@fullcalendar/vue3';
import dayjs from 'dayjs';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const { works, fetchWorkFullList } = useWork();
const router = useRouter();
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
let resizeTimer: number | null = null;
const calendarOption = ref<CalendarOptions>({
  plugins: [interactionPlugin, dayGridPlugin],
  initialView: 'dayGridMonth',
  height: '100%',
  expandRows: true,
  selectable: true,
  dateClick: onClickDate,
  eventClick: onClickEvent,
  eventDidMount: onDidMountEvent,
  events: [],
});
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(
  works,
  (currentWorks) => {
    calendarOption.value.events = currentWorks.map((work) => ({
      id: work.id,
      title: work.title,
      date: dayjs(work.dueDate).format('YYYY-MM-DD'),
    }));
  },
  { immediate: true },
);
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
onBeforeMount(() => {
  fetchWorkFullList();
});

onMounted(() => {
  requestCalendarSize();
  window.addEventListener('resize', onResizeCalendar);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResizeCalendar);
  if (resizeTimer) {
    window.clearTimeout(resizeTimer);
    resizeTimer = null;
  }
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const requestCalendarSize = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      calendarRef.value?.getApi().updateSize();
    });
  });
};

const onResizeCalendar = () => {
  if (resizeTimer) {
    window.clearTimeout(resizeTimer);
  }
  resizeTimer = window.setTimeout(() => {
    calendarRef.value?.getApi().updateSize();
  }, 100);
};

function onClickDate(args: DateClickArg) {
  console.log(args);
}

function onClickEvent(args: EventClickArg) {
  console.log(args);
  router.push(`/detail/${args.event.id}`);
}

function onDidMountEvent(args: EventMountArg) {
  tippy(args.el, { content: args.event.title });
}

/* ======================= 메서드 ======================= */
</script>
