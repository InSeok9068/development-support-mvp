<template>
  <main class="container mx-auto">
    <sl-card class="w-full">
      <div class="mb-4">
        <h4 class="font-semibold">대시보드</h4>
        <div class="text-xs text-slate-500">업무 현황 요약</div>
      </div>
      <Bar :data="data" />
    </sl-card>
  </main>
</template>

<script setup lang="ts">
import { Chart, type ChartData, registerables } from 'chart.js';
import { ref } from 'vue';
import { Bar } from 'vue-chartjs';

Chart.register(...registerables);

/* ======================= 변수 ======================= */
const data = ref<ChartData<'bar'>>({
  datasets: [
    {
      label: '테스트',
      data: [],
    },
  ],
});
/* ======================= 변수 ======================= */
</script>
