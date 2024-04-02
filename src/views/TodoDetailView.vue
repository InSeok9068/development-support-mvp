<template>
  <main class="container">
    <article>
      <nav>
        <ul>
          <li>
            <h4>제목</h4>
          </li>
        </ul>
        <ul>
          <li>
            <h4><i class="bi bi-floppy" style="cursor: pointer" @click="updateWork"></i></h4>
          </li>
          <li>
            <h4><i class="bi bi-trash" style="cursor: pointer" @click="deleteWork(work.id)"></i></h4>
          </li>
        </ul>
      </nav>
      <input v-model="work.title" style="font-size: xx-large" />
      <div role="group">
        <label>
          마크다운 VIEW
          <input type="checkbox" role="switch" @change="switchView" />
        </label>
        <label>
          완료여부
          <input v-model="work.done" type="checkbox" role="switch" />
        </label>
      </div>
      <label>
        <strong>내용</strong>
        <textarea v-model="work.content" rows="10"></textarea>
      </label>
      <label>
        <strong>레드마인 URL</strong>
        <div role="group">
          <input v-model="work.redmine" type="url" />
          <button v-show="work.redmine" @click="onClickRedmine(work.redmine)">OPEN</button>
        </div>
      </label>
      <label>
        <strong>조플린 URL</strong>
        <div role="group">
          <input v-model="work.joplin" type="url" />
          <button v-show="work.joplin" @click="onClickJoplin(work.joplin)">OPEN</button>
        </div>
      </label>
      <label>
        <strong>개발자</strong>
        <select v-model="work.developer">
          <template v-for="developer in developers">
            <option :value="developer.id" :selected="work.developer == developer.id">
              <span>{{ developer.name }}</span>
            </option>
          </template>
        </select>
      </label>
      <div role="group">
        <label>
          <strong>마감일시</strong>
          <input v-model="work.dueDate" type="date" />
        </label>
      </div>
      <div role="group">
        <label>
          <strong>등록일시</strong>
          <input type="datetime" readonly :value="dayjs(work.created).format('YYYY-MM-DD HH:mm:ss')" />
        </label>
        <label>
          <strong>수정일시</strong>
          <input type="datetime" readonly :value="dayjs(work.updated).format('YYYY-MM-DD HH:mm:ss')" />
        </label>
      </div>
    </article>
  </main>
</template>

<script setup>
import { useDeveloper } from '@/composables/developer';
import { useWork } from '@/composables/work';
import dayjs from 'dayjs';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
const { work, selectWork, updateWork, deleteWork } = useWork();
const { developers, selectDeveloperList } = useDeveloper();

const route = useRoute();

onMounted(() => {
  selectWork(route.params.id);
  selectDeveloperList();
});

const onClickRedmine = (url) => {
  window.open('about:blank').location.href = url;
};

const onClickJoplin = (url) => {
  window.open('about:blank').location.href = url;
};
</script>
