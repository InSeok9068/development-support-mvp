<template>
  <main class="container mx-auto">
    <sl-card class="w-full">
      <div class="mb-4">
        <h4 class="font-semibold">검색 필터</h4>
        <div class="text-xs text-slate-500">기간/상태/담당 기준으로 빠르게 좁혀보세요</div>
      </div>

      <div class="grid gap-3 md:grid-cols-3">
        <sl-input v-model="listFilter.createdFrom" type="date" label="등록일자 (FROM)"></sl-input>
        <sl-input v-model="listFilter.createdTo" type="date" label="등록일자 (TO)"></sl-input>
        <sl-input v-model="listFilter.doneDate" type="date" label="완료일자"></sl-input>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <sl-switch v-model="listFilter.done"></sl-switch>
          <span class="text-sm">완료여부</span>
        </div>
        <div class="flex items-center gap-2">
          <sl-switch v-model="weeklyReport" @sl-change="onChangeSetWeeklyReportDate"></sl-switch>
          <span class="text-sm">주간보고서</span>
        </div>
      </div>

      <sl-details class="mt-5" summary="옵션 더보기">
        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <sl-input v-model="listFilter.updatedFrom" type="date" label="수정일자 (FROM)"></sl-input>
          <sl-input v-model="listFilter.updatedTo" type="date" label="수정일자 (TO)"></sl-input>
          <sl-input v-model="listFilter.dueDate" type="date" label="마감일자"></sl-input>
          <sl-select v-model="listFilter.developer" label="개발자" placeholder="개발자 선택">
            <sl-option value="ALL">전체</sl-option>
            <sl-option value="">미배정</sl-option>
            <template v-for="developer in developers" :key="developer.id">
              <sl-option :value="developer.id">{{ developer.name }}</sl-option>
            </template>
          </sl-select>
        </div>
      </sl-details>

      <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <sl-input
          v-model="listFilter.text"
          class="w-full"
          type="search"
          placeholder="제목 또는 키워드 검색"
          @keydown.stop.prevent.enter="onClickSearch"
        ></sl-input>
        <sl-button class="w-full sm:w-auto" variant="primary" @click="onClickSearch">검색</sl-button>
      </div>

      <sl-divider class="my-3"></sl-divider>

      <AgGridVue
        :theme="theme"
        :grid-options="gridOptions"
        :column-defs="columns"
        :row-data="rowData"
        :pagination="true"
        :pagination-page-size="15"
        :pagination-page-size-selector="[15, 30, 100]"
      />
    </sl-card>
  </main>
</template>

<script setup lang="ts">
import type { DevelopersResponse, WorksResponse } from '@/api/pocketbase-types';
import { useGlobal } from '@/composables/global';
import { useDeveloper } from '@/composables/todo/developer';
import { useSearch } from '@/composables/todo/search';
import { useWork } from '@/composables/todo/work';
import type { UiWorkList } from '@/ui/todo.ui';
import {
  AllCommunityModule,
  ModuleRegistry,
  colorSchemeDark,
  themeAlpine,
  type ColDef,
  type GridOptions,
  type RowClickedEvent,
  type Theme,
} from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

dayjs.extend(weekday);
ModuleRegistry.registerModules([AllCommunityModule]);

/* ======================= 변수 ======================= */
const router = useRouter();
const { works, fetchWorkList } = useWork();
const { developers, fetchDeveloperList } = useDeveloper();
const { listFilter } = useSearch();
const { global } = useGlobal();
const weeklyReport = ref(false);
const whiteTheme = themeAlpine;
const darkTheme = themeAlpine.withPart(colorSchemeDark);
const theme = ref<Theme>(global.value.theme === 'white' ? whiteTheme : darkTheme);

const gridOptions: GridOptions = {
  theme: theme.value,
  domLayout: 'autoHeight',
  autoSizeStrategy: {
    type: 'fitGridWidth',
  },
  onRowClicked(event: RowClickedEvent) {
    router.push(`/detail/${event.data.id}`);
  },
};
const columns = ref<ColDef<UiWorkList>[]>([
  { field: 'title', headerName: '제목' },
  { field: 'developer', headerName: '개발자', width: 50 },
  { field: 'created', headerName: '등록일자', width: 80 },
  { field: 'updated', headerName: '수정일자', width: 80 },
]);
const rowData = ref<UiWorkList[]>([]);
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(works, (newValue) => {
  rowData.value = newValue.map((work: WorksResponse) => ({
    id: work.id,
    title: work.title,
    developer: developers.value.find((developer: DevelopersResponse) => developer.id === work.developer)?.name ?? '',
    created: dayjs(work.created).format('YYYY-MM-DD HH:mm:ss'),
    updated: dayjs(work.updated).format('YYYY-MM-DD HH:mm:ss'),
  }));
});

watch(global.value, (newValue) => {
  theme.value = newValue.theme === 'white' ? whiteTheme : darkTheme;
});

/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  fetchDeveloperList();
  onClickSearch();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickSearch = () => {
  fetchWorkList({
    filter: `
      title ~ '${listFilter.value.text}'
      && created >= '${listFilter.value.createdFrom}'
      && created <= '${listFilter.value.createdTo} 23:59:59'
      && done = ${listFilter.value.done}
      ${listFilter.value.doneDate && `&& doneDate ~ '${listFilter.value.doneDate}'`}
      ${listFilter.value.dueDate && `&& dueDate ~ '${listFilter.value.dueDate}'`}
      ${listFilter.value.updatedFrom && `&& updated >= '${listFilter.value.updatedFrom}'`}
      ${listFilter.value.updatedTo && `&& updated <= '${listFilter.value.updatedTo} 23:59:59'`}
      ${listFilter.value.developer !== 'ALL' ? `&& developer = '${listFilter.value.developer}'` : ''}
    `,
    perPage: 100000,
  });
};

const onChangeSetWeeklyReportDate = () => {
  if (weeklyReport.value) {
    listFilter.value.updatedFrom = dayjs(new Date()).startOf('week').add(1, 'day').format('YYYY-MM-DD');
    listFilter.value.updatedTo = dayjs(new Date()).startOf('week').add(5, 'day').format('YYYY-MM-DD');
  } else {
    listFilter.value.updatedFrom = '';
    listFilter.value.updatedTo = '';
  }
};

/* ======================= 메서드 ======================= */
</script>

<style>
:root {
  --ag-font-size: var(--pico-font-size);
  --ag-data-font-size: var(--pico-font-size);
}

.ag-paging-panel {
  padding: 25px;
}

@media (max-width: 640px) {
  .ag-paging-panel {
    height: auto;
    padding: 12px;
    gap: 8px;
    flex-direction: column;
    align-items: stretch;
  }

  .ag-paging-panel > * {
    margin: 0;
  }

  .ag-paging-page-size,
  .ag-paging-page-summary-panel,
  .ag-paging-button-row {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
