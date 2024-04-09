<template>
  <main class="container">
    <article>
      <div role="group">
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
      <form role="search">
        <input v-model="search.text" type="search" @keydown.stop.prevent.enter="onClickSearch" />
        <input type="button" value="검색" @click="onClickSearch" />
      </form>
      <table>
        <thead>
          <tr>
            <th>제목</th>
            <th>내용</th>
            <th>상세보기</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="work in works" :key="work.id">
            <td>{{ work.title }}</td>
            <td style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden; max-width: 450px">
              {{ work.content }}
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
import { useWork } from '@/composables/todo/work';
import dayjs from 'dayjs';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { works, selectWorkList } = useWork();

const search = ref({
  createdFrom: dayjs(new Date()).subtract(14, 'd').format('YYYY-MM-DD'),
  createdTo: dayjs(new Date()).format('YYYY-MM-DD'),
  doneDate: '',
  text: '',
});

const showAddButton = ref(true);

const pagination = ref({
  page: 1,
  perPage: 15,
});

onMounted(() => onClickSearch());

const onClickSearch = () => {
  selectWorkList({
    filter: `
    title ~ '${search.value.text}'
    && created >= '${search.value.createdFrom}'
    && created <= '${search.value.createdTo} 23:59:59'
    ${search.value.doneDate && `&& doneDate ~ '${search.value.doneDate}'`}
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
