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
import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

/* ======================= 변수 ======================= */
const { works, selectWorkFullList } = useWork();
const router = useRouter();
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onBeforeMount(() => {
  selectWorkFullList();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickDate = (args: DateClickArg) => {
  console.log(args);
};

const onClickEvent = (args: EventClickArg) => {
  console.log(args);
  router.push(`/detail/${args.event.id}`);
};

const onDidMountEvent = (args: EventMountArg) => {
  tippy(args.el, { content: args.event.title });
};

const calendarOption = ref<CalendarOptions>({
  plugins: [interactionPlugin, dayGridPlugin],
  initialView: 'dayGridMonth',
  selectable: true,
  dateClick: onClickDate,
  eventClick: onClickEvent,
  eventDidMount: onDidMountEvent,
  events: [],
});

// 초기 데이터 바인딩
setTimeout(
  () =>
    (calendarOption.value.events = works.value.map((work) => ({
      id: work.id,
      title: work.title,
      date: dayjs(work.dueDate).format('YYYY-MM-DD'),
    }))),
  100,
);
/* ======================= 메서드 ======================= */
</script>
