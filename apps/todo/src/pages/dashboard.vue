<template>
  <main class="container mx-auto">
    <sl-card class="w-full">
      <div class="mb-4">
        <h4 class="font-semibold">대시보드</h4>
        <div class="text-xs text-slate-500">업무 현황 요약</div>
      </div>
      <div class="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
        <div class="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>필터</span>
          <span>{{ filteredWorks.length }}건</span>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <sl-select class="w-full sm:w-56" :value="selectedDeveloperId" @sl-change="onChangeDeveloperFilter">
            <sl-option value="ALL">ALL</sl-option>
            <sl-option value="">미배정</sl-option>
            <template v-for="developer in developers" :key="developer.id">
              <sl-option :value="developer.id">{{ developer.name }}</sl-option>
            </template>
          </sl-select>
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <sl-checkbox :checked="statusFilter.undone" @sl-change="onChangeStatusFilter('undone', $event)">
              미완료
            </sl-checkbox>
            <sl-checkbox :checked="statusFilter.done" @sl-change="onChangeStatusFilter('done', $event)">
              완료
            </sl-checkbox>
          </div>
        </div>
      </div>
      <div class="grid gap-4">
        <sl-card class="w-full">
          <div class="mb-2 text-sm font-semibold">개발자별 업무량</div>
          <div class="h-72">
            <Bar :data="developerWorkChartData" :options="barOptions" />
          </div>
        </sl-card>
        <sl-card class="w-full">
          <div class="mb-2 text-sm font-semibold">업무 상태 분포</div>
          <div class="h-80">
            <Doughnut :data="stateChartData" :options="doughnutOptions" />
          </div>
        </sl-card>
        <sl-card class="w-full">
          <div class="mb-2 text-sm font-semibold">마감일 추이 (14일)</div>
          <div class="h-72">
            <Line :data="dueChartData" :options="lineOptions" />
          </div>
        </sl-card>
      </div>
    </sl-card>
  </main>
</template>

<script setup lang="ts">
import { useDeveloper } from '@/composables/todo/developer';
import { useWork } from '@/composables/todo/work';
import { Chart, type ChartData, type ChartOptions, registerables } from 'chart.js';
import dayjs from 'dayjs';
import { computed, onMounted, ref } from 'vue';
import { Bar, Doughnut, Line } from 'vue-chartjs';

Chart.register(...registerables);

/* ======================= 변수 ======================= */
const { works, fetchWorkFullList } = useWork();
const { developers, fetchDeveloperList } = useDeveloper();
const selectedDeveloperId = ref<string>('ALL');
const statusFilter = ref({
  done: true,
  undone: true,
});

const filteredWorks = computed(() => {
  const developer = selectedDeveloperId.value;
  const filteredByDeveloper =
    developer === 'ALL'
      ? works.value
      : developer === ''
        ? works.value.filter((work) => !work.developer)
        : works.value.filter((work) => work.developer === developer);

  return filteredByDeveloper.filter((work) => {
    const isDone = Boolean(work.done);
    return (statusFilter.value.done && isDone) || (statusFilter.value.undone && !isDone);
  });
});

const developerLabelItems = computed(() => [
  ...developers.value.map((developer) => ({
    id: developer.id,
    name: developer.name,
  })),
  { id: '', name: '미배정' },
]);

const developerWorkChartData = computed<ChartData<'bar'>>(() => {
  const labels = developerLabelItems.value.map((item) => item.name);
  const data = developerLabelItems.value.map((item) => {
    if (!item.id) {
      return filteredWorks.value.filter((work) => !work.developer).length;
    }
    return filteredWorks.value.filter((work) => work.developer === item.id).length;
  });

  return {
    labels,
    datasets: [
      {
        label: '업무 수',
        data,
      },
    ],
  };
});

const stateChartData = computed<ChartData<'doughnut'>>(() => {
  const counts = {
    wait: 0,
    doing: 0,
    done: 0,
    other: 0,
  };

  filteredWorks.value.forEach((work) => {
    if (work.state === 'wait') counts.wait += 1;
    else if (work.state === 'doing') counts.doing += 1;
    else if (work.state === 'done') counts.done += 1;
    else counts.other += 1;
  });

  return {
    labels: ['대기', '진행', '완료', '기타'],
    datasets: [
      {
        label: '상태',
        data: [counts.wait, counts.doing, counts.done, counts.other],
      },
    ],
  };
});

const dueChartData = computed<ChartData<'line'>>(() => {
  const labels = Array.from({ length: 14 }, (_, index) => dayjs().add(index, 'day').format('MM/DD'));
  const data = labels.map((label) => {
    return filteredWorks.value.filter((work) => {
      if (!work.dueDate) return false;
      return dayjs(work.dueDate).format('MM/DD') === label;
    }).length;
  });

  return {
    labels,
    datasets: [
      {
        label: '마감',
        data,
        tension: 0.3,
        fill: true,
      },
    ],
  };
});

const barOptions = ref<ChartOptions<'bar'>>({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
});

const doughnutOptions = ref<ChartOptions<'doughnut'>>({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
});

const lineOptions = ref<ChartOptions<'line'>>({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      ticks: {
        precision: 0,
      },
    },
  },
});
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  fetchWorkFullList({ filter: "id != ''", sort: '-created' });
  fetchDeveloperList();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onChangeDeveloperFilter = (event: Event) => {
  const target = event.target as HTMLInputElement & { value: string };
  selectedDeveloperId.value = target.value;
};

const onChangeStatusFilter = (key: keyof typeof statusFilter.value, event: Event) => {
  const target = event.target as HTMLInputElement & { checked: boolean };
  statusFilter.value[key] = target.checked;
};
/* ======================= 메서드 ======================= */
</script>
