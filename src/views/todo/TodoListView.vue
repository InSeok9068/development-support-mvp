<template>
  <main class="container">
    <article>
      <div class="grid">
        <label>
          등록일자 (FROM)
          <input v-model="search.createdFrom" type="date" />
        </label>
        <label>
          등록일자 (TO)
          <input v-model="search.createdTo" type="date" />
        </label>
        <label>
          완료일자
          <input v-model="search.doneDate" type="date" />
        </label>
      </div>
      <div class="grid">
        <label>
          완료여부
          <input v-model="search.done" type="checkbox" role="switch" />
        </label>
      </div>
      <details>
        <summary role="button" class="outline">옵션 더보기</summary>
        <div class="grid">
          <label>
            마감일자
            <input v-model="search.dueDate" type="date" />
          </label>
          <label>
            수정일자
            <input v-model="search.updated" type="date" />
          </label>
          <label>
            개발자
            <select v-model="search.developer">
              <template v-for="developer in developers">
                <option :value="developer.id">
                  <span>{{ developer.name }}</span>
                </option>
              </template>
            </select>
          </label>
        </div>
      </details>
      <form role="search">
        <input v-model="search.text" type="search" @keydown.stop.prevent.enter="onClickSearch" />
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
            <td style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden; max-width: 600px">
              {{ work.title }}
            </td>
            <td>
              {{ developers.find((developer) => developer.id === work.developer)?.name }}
            </td>
            <td>
              <i class="bi bi-box-arrow-right" style="cursor: pointer" @click="router.push(`/detail/${work.id}`)"></i>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-show="showAddButton">
        <strong>현재 리스트 15개...&nbsp;&nbsp;</strong>
        <a href="#" @click.stop.prevent="onClickAddButton">더보기</a>
      </div>
    </article>
  </main>
</template>

<script setup lang="ts">
import { useDeveloper } from '@/composables/todo/developer';
import { useWork } from '@/composables/todo/work';
import dayjs from 'dayjs';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { works, selectWorkList } = useWork();
const { developers, selectDeveloperFullList } = useDeveloper();

const search = ref({
  createdFrom: dayjs(new Date()).subtract(14, 'd').format('YYYY-MM-DD'),
  createdTo: dayjs(new Date()).format('YYYY-MM-DD'),
  done: true,
  doneDate: '',
  dueDate: '',
  updated: '',
  text: '',
  developer: '',
});

const showAddButton = ref(true);

const pagination = ref({
  page: 1,
  perPage: 15,
});

onMounted(() => {
  selectDeveloperFullList();
  onClickSearch();
});

const onClickSearch = () => {
  selectWorkList({
    filter: `
    title ~ '${search.value.text}'
    && created >= '${search.value.createdFrom}'
    && created <= '${search.value.createdTo} 23:59:59'
    && done = ${search.value.done}
    ${search.value.doneDate && `&& doneDate ~ '${search.value.doneDate}'`}
    ${search.value.dueDate && `&& dueDate ~ '${search.value.dueDate}'`}
    ${search.value.updated && `&& updated ~ '${search.value.updated}'`}
    ${search.value.developer && `&& developer ~ '${search.value.developer}'`}
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
</script>
