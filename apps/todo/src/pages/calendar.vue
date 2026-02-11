<template>
  <main class="container mx-auto px-3 py-4 lg:px-4">
    <sl-card class="w-full shadow-sm">
      <div class="mb-4">
        <h4 class="font-semibold">캘린더</h4>
        <div class="text-xs text-slate-500">마감 일정과 이벤트를 확인하세요</div>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <span class="text-slate-600 dark:text-slate-300">표시 기준</span>
        <div class="flex flex-wrap items-center gap-3">
          <sl-checkbox :checked="eventTypeFilter.created" @sl-change="onChangeEventTypeFilter('created', $event)">
            <sl-badge variant="primary">등록일자</sl-badge>
          </sl-checkbox>
          <sl-checkbox :checked="eventTypeFilter.updated" @sl-change="onChangeEventTypeFilter('updated', $event)">
            <sl-badge variant="warning">수정일자</sl-badge>
          </sl-checkbox>
          <sl-checkbox :checked="eventTypeFilter.due" @sl-change="onChangeEventTypeFilter('due', $event)">
            <sl-badge variant="success">마감일자</sl-badge>
          </sl-checkbox>
        </div>
      </div>
      <div class="h-[70vh] min-h-140">
        <FullCalendar ref="calendarRef" class="h-full" :options="calendarOption" />
      </div>
    </sl-card>
  </main>
</template>

<script setup lang="ts">
import type { WorksResponse } from '@/api/pocketbase-types';
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
const eventTypeFilter = ref({
  created: false,
  updated: false,
  due: true,
});
const eventTypeLabelMap = {
  created: '등록일자',
  updated: '수정일자',
  due: '마감일자',
} as const;
const eventTypeColorMap = {
  created: 'var(--sl-color-primary-600)',
  updated: 'var(--sl-color-warning-600)',
  due: 'var(--sl-color-success-600)',
} as const;
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

const buildCalendarEvents = (currentWorks: WorksResponse[]) => {
  const isNoneSelected = !eventTypeFilter.value.created && !eventTypeFilter.value.updated && !eventTypeFilter.value.due;
  const effectiveFilter = {
    created: isNoneSelected ? true : eventTypeFilter.value.created,
    updated: isNoneSelected ? true : eventTypeFilter.value.updated,
    due: isNoneSelected ? true : eventTypeFilter.value.due,
  };
  const events = [];
  for (const work of currentWorks) {
    if (effectiveFilter.created) {
      events.push({
        id: `${work.id}-created`,
        title: work.title,
        date: dayjs(work.created).format('YYYY-MM-DD'),
        backgroundColor: eventTypeColorMap.created,
        borderColor: eventTypeColorMap.created,
        textColor: 'var(--sl-color-neutral-0)',
        extendedProps: { eventType: 'created', workId: work.id },
      });
    }

    if (effectiveFilter.updated) {
      events.push({
        id: `${work.id}-updated`,
        title: work.title,
        date: dayjs(work.updated).format('YYYY-MM-DD'),
        backgroundColor: eventTypeColorMap.updated,
        borderColor: eventTypeColorMap.updated,
        textColor: 'var(--sl-color-neutral-0)',
        extendedProps: { eventType: 'updated', workId: work.id },
      });
    }

    if (effectiveFilter.due && work.dueDate) {
      events.push({
        id: `${work.id}-due`,
        title: work.title,
        date: dayjs(work.dueDate).format('YYYY-MM-DD'),
        backgroundColor: eventTypeColorMap.due,
        borderColor: eventTypeColorMap.due,
        textColor: 'var(--sl-color-neutral-0)',
        extendedProps: { eventType: 'due', workId: work.id },
      });
    }
  }
  return events;
};

const applyCalendarEvents = (currentWorks: WorksResponse[]) => {
  const events = buildCalendarEvents(currentWorks);
  const api = calendarRef.value?.getApi();
  if (api) {
    api.removeAllEvents();
    api.addEventSource(events);
    return;
  }
  calendarOption.value.events = events;
};
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(
  [works, eventTypeFilter],
  () => {
    applyCalendarEvents(works.value);
  },
  { immediate: true, deep: true },
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
  const workId = args.event.extendedProps.workId as string | undefined;
  if (workId) {
    router.push(`/detail/${workId}`);
  }
}

function onDidMountEvent(args: EventMountArg) {
  const eventType = args.event.extendedProps.eventType as keyof typeof eventTypeLabelMap | undefined;
  const label = eventType ? eventTypeLabelMap[eventType] : '일정';
  tippy(args.el, { content: `${label}: ${args.event.title}` });
}

const onChangeEventTypeFilter = (key: keyof typeof eventTypeFilter.value, event: Event) => {
  const target = event.target as HTMLInputElement & { checked: boolean };
  eventTypeFilter.value[key] = target.checked;
};

/* ======================= 메서드 ======================= */
</script>
