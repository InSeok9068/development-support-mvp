<template>
  <main class="container mx-auto">
    <sl-card class="w-full">
      <div class="mb-4">
        <h4 class="font-semibold">프로젝트 간트</h4>
        <div class="text-xs text-slate-500">일정 흐름을 한눈에 확인하세요</div>
      </div>
      <div ref="ganttContainer" class="h-[70vh] min-h-[560px]"></div>
    </sl-card>
  </main>
</template>

<script setup lang="ts">
import { gantt } from 'dhtmlx-gantt';
import { onMounted, ref } from 'vue';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

/* ======================= 변수 ======================= */
const ganttContainer = ref<HTMLElement | string>('');
const tasks = ref({
  data: [
    { id: 1, text: 'Task #1', start_date: '2020-01-01', duration: 3, progress: 0.6 },
    { id: 2, text: 'Task #2', start_date: '2020-01-10', duration: 3, progress: 0.4 },
  ],
  // links: [],
});
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  gantt.config.date_format = '%Y-%m-%d';
  gantt.init(ganttContainer.value);
  gantt.parse(tasks.value);
});
/* ======================= 생명주기 훅 ======================= */
</script>

<style>
.gantt_duration {
  margin-top: -35px;
}
.gantt_popup_button.gantt_ok_button,
.gantt_popup_button.gantt_cancel_button {
  height: auto;
}
</style>
