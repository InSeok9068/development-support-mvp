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
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue';
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
let syncEventTimer: number | null = null;
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onBeforeMount(() => {
  fetchWorkFullList();
});

onMounted(() => {
  syncEventTimer = window.setTimeout(() => {
    calendarOption.value.events = works.value.map((work) => ({
      id: work.id,
      title: work.title,
      date: dayjs(work.dueDate).format('YYYY-MM-DD'),
    }));
  }, 100);
});

onUnmounted(() => {
  if (syncEventTimer) {
    window.clearTimeout(syncEventTimer);
    syncEventTimer = null;
  }
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
