<template>
  <main class="container">
    <article>
      <FullCalendar :options="calendarOption" />
    </article>
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
import { onBeforeMount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

/* ======================= 변수 ======================= */
const { works, fetchWorkFullList } = useWork();
const router = useRouter();
const calendarOption = ref<CalendarOptions>({
  plugins: [interactionPlugin, dayGridPlugin],
  initialView: 'dayGridMonth',
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
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
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
