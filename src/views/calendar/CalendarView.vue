<template>
  <main class="container">
    <FullCalendar :options="calendarOption" />
  </main>
</template>

<script setup lang="ts">
import { useWork } from '@/composables/todo/work';
import type { CalendarOptions, EventClickArg } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction/index.js';
import FullCalendar from '@fullcalendar/vue3';
import dayjs from 'dayjs';
import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';

const { works, selectWorkFullList } = useWork();
const router = useRouter();

const onClickDate = (args: DateClickArg) => {
  console.log(args);
};

const onClickEvent = (args: EventClickArg) => {
  console.log(args);
  router.push(`/detail/${args.event.id}`);
};

const calendarOption = ref<CalendarOptions>({
  plugins: [interactionPlugin, dayGridPlugin],
  initialView: 'dayGridMonth',
  selectable: true,
  dateClick: onClickDate,
  eventClick: onClickEvent,
  events: [],
});

// 초기 데이터 바인딩
setTimeout(
  () =>
    (calendarOption.value.events = works.value.map((work) => ({
      id: work.id,
      title: work.title,
      date: dayjs(work.created).format('YYYY-MM-DD'),
    }))),
  100,
);

onBeforeMount(() => {
  selectWorkFullList();
});
</script>
