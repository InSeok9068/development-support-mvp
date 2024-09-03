<template>
  <main class="container">
    <article>
      <div class="grid">
        <label>
          등록일자 (FROM)
          <input v-model="listFilter.createdFrom" type="date" />
        </label>
        <label>
          등록일자 (TO)
          <input v-model="listFilter.createdTo" type="date" />
        </label>
        <label>
          완료일자
          <input v-model="listFilter.doneDate" type="date" />
        </label>
      </div>

      <div class="grid">
        <label>
          완료여부
          <input v-model="listFilter.done" type="checkbox" role="switch" />
        </label>
      </div>

      <details>
        <summary role="button" class="outline">옵션 더보기</summary>
        <div class="grid">
          <label>
            수정일자 (FROM)
            <input v-model="listFilter.updatedFrom" type="date" />
          </label>
          <label>
            수정일자 (TO)
            <input v-model="listFilter.updatedTo" type="date" />
          </label>
          <label>
            마감일자
            <input v-model="listFilter.dueDate" type="date" />
          </label>
          <label>
            개발자
            <select v-model="listFilter.developer">
              <option value="ALL">
                <span></span>
              </option>
              <option value="">
                <span>미배정</span>
              </option>
              <template v-for="developer in developers">
                <option :value="developer.id">
                  <span>{{ developer.name }}</span>
                </option>
              </template>
            </select>
          </label>
        </div>
        <div class="grid">
          <label>
            주간보고서
            <input v-model="weeklyReport" type="checkbox" role="switch" @change="onChangeSetWeeklyReportDate" />
          </label>
        </div>
      </details>

      <form role="search">
        <input v-model="listFilter.text" type="search" @keydown.stop.prevent.enter="onClickSearch" />
        <input type="button" value="검색" @click="onClickSearch" />
      </form>

      <table>
        <thead>
          <tr>
            <th>제목</th>
            <th>개발자</th>
            <th>상세보기</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="work in works" :key="work.id">
            <td class="max-w-48 overflow-hidden text-ellipsis whitespace-nowrap">
              {{ work.title }}
            </td>
            <td>
              {{ developers.find((developer: DevelopersResponse) => developer.id === work.developer)?.name }}
            </td>
            <td>
              <i class="bi bi-box-arrow-right cursor-pointer" @click="router.push(`/detail/${work.id}`)"></i>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-show="showAddButton">
        <strong>현재 리스트 최대 15개...&nbsp;&nbsp;</strong>
        <a href="#" @click.stop.prevent="onClickAddButton">더보기</a>
      </div>
    </article>
  </main>
</template>

<script setup lang="ts">
import pb from '@/api/pocketbase';
import type { DevelopersResponse } from '@/api/pocketbase-types';
import { useSearch } from '@/composables/todo/search';
import { useWork } from '@/composables/todo/work';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
dayjs.extend(weekday);

/* ======================= 변수 ======================= */
const router = useRouter();
const { works, selectWorkList } = useWork();
const { listFilter } = useSearch();
const developers = ref<DevelopersResponse[]>([]);
const showAddButton = ref(true);
const weeklyReport = ref(false);
const pagination = ref({
  page: 1,
  perPage: 15,
});
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  selectDeveloperFullList();
  onClickSearch();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickSearch = () => {
  selectWorkList({
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
    page: pagination.value.page,
    perPage: pagination.value.perPage,
  });
};

const onClickAddButton = () => {
  pagination.value = {
    ...pagination.value,
    perPage: 5000,
  };
  showAddButton.value = false;
  onClickSearch();
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

const selectDeveloperFullList = async () => {
  developers.value = await pb.collection('developers').getFullList({
    filter: `del = false`,
    sort: 'sort',
  });
};
/* ======================= 메서드 ======================= */
</script>
