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
            <h4><i class="bi bi-floppy cursor-pointer" @click="onClickUpdate()"></i></h4>
          </li>
          <li>
            <h4><i class="bi bi-trash cursor-pointer" @click="onClickDelete()"></i></h4>
          </li>
        </ul>
      </nav>

      <input v-model="work.title" class="text-2xl" />

      <div class="grid" role="group">
        <label>
          완료여부
          <input v-model="work.done" type="checkbox" role="switch" @change="onChangeDone" />
        </label>
        <label>
          마크다운 VIEW
          <input v-model="switchView" type="checkbox" role="switch" @change="onChangeSwitchView" />
        </label>
      </div>

      <div class="grid">
        <template v-for="state in getCodesByType('workState')">
          <label>
            <i :class="state.class"></i>
            {{ state.desc }}
            <input
              v-model="work.state"
              type="radio"
              name="state"
              :value="state.value"
              :selected="work.state === state.value"
            />
          </label>
        </template>
      </div>

      <label>
        <strong>내용</strong>
        <textarea
          v-show="!markdownViewOn"
          id="textareaView"
          v-model="work.content"
          :style="{ height: `${work.contentBoxHeight}px` }"
        ></textarea>
        <article v-show="markdownViewOn">
          <div id="markdownView"></div>
        </article>
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

      <label>
        <strong>마감일시</strong>
        <input
          :value="dayjs(work.dueDate).format('YYYY-MM-DD')"
          type="date"
          @input="(e: Event) => (work.dueDate = (e.target as any).value)"
        />
      </label>

      <label>
        <strong>미리알람</strong>
        <div role="group">
          <input v-model="scheduledNotificationTime" type="datetime-local" />
          <button @click="onClickCreateScheduledNotification">SAVE</button>
        </div>
        <table v-show="(work.expand?.scheduledNotifications ?? []).length > 0">
          <thead>
            <th>알람시간</th>
          </thead>
          <tbody>
            <tr v-for="scheduledNotification in work.expand?.scheduledNotifications">
              <td>
                {{ dayjs(scheduledNotification.time).subtract(9, 'h').format('YYYY-MM-DD HH:mm:ss') }}
                <i
                  class="bi bi-trash ml-1 cursor-pointer"
                  @click.stop.prevent="onClickDeleteScheduledNotification(scheduledNotification.id)"
                ></i>
              </td>
            </tr>
          </tbody>
        </table>
      </label>

      <!-- TODO Multiple 파일 업로드 기능 검토 -->
      <strong>첨부파일</strong>
      <input id="fileInput" type="file" class="block !w-unset" />
      <div v-show="work.file" class="mb-5">
        <a :href="pb.files.getUrl(work, work.file)" target="_blank">
          {{ work.file }}
        </a>
        <i class="bi bi-trash ml-5 cursor-pointer" @click.stop.prevent="onClickDeleteWorkFile(work)"></i>
      </div>

      <div role="group">
        <label>
          <strong>완료일시</strong>
          <input readonly :value="work.doneDate && dayjs(work.doneDate).format('YYYY-MM-DD HH:mm:ss')" />
        </label>
        <label>
          <strong>등록일시</strong>
          <input readonly :value="dayjs(work.created).format('YYYY-MM-DD HH:mm:ss')" />
        </label>
        <label>
          <strong>수정일시</strong>
          <input readonly :value="dayjs(work.updated).format('YYYY-MM-DD HH:mm:ss')" />
        </label>
      </div>
    </article>
  </main>
</template>

<script setup lang="ts">
import pb from '@/api/pocketbase';
import type {
  ScheduledNotificationsRecord,
  ScheduledNotificationsResponse,
  WorksResponse,
} from '@/api/pocketbase-types';
import { useCode } from '@/composables/code';
import { useModal } from '@/composables/modal';
import { useDeveloper } from '@/composables/todo/developer';
import { useWork } from '@/composables/todo/work';
import { useMagicKeys } from '@vueuse/core';
import dayjs from 'dayjs';
import { marked } from 'marked';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const { deleteWork } = useWork();
const { getCodesByType } = useCode();
const { showMessageModal } = useModal();
const { developers, selectDeveloperFullList } = useDeveloper();
const route = useRoute();
const router = useRouter();
const keys = useMagicKeys();
const markdownViewOn = ref(false);
const scheduledNotificationTime = ref<string>('');
const switchView = ref(false);
const work = ref<
  WorksResponse<{
    scheduledNotifications?: ScheduledNotificationsResponse[];
  }>
>(
  {} as WorksResponse<{
    scheduledNotifications?: ScheduledNotificationsResponse[];
  }>,
);
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(keys.shift_enter, (v) => v && updateWork());

watch(keys.alt_v, (v) => {
  if (v) {
    switchView.value = !switchView.value;
    onChangeSwitchView();
  }
});
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  selectWork(route.params.id as string);
  selectDeveloperFullList();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onChangeDone = () => {
  if (work.value.done) {
    work.value.doneDate = new Date().toISOString();
    work.value.state = 'done';
  } else {
    work.value.doneDate = '';
    work.value.state = 'wait';
  }
};

const onClickRedmine = (url: string) => {
  window.open('about:blank')!.location.href = url;
};

const onClickJoplin = (url: string) => {
  location.href = url;
};

const onChangeSwitchView = async () => {
  markdownViewOn.value = switchView.value;
  if (markdownViewOn.value) {
    document.getElementById('markdownView')!.innerHTML = await marked.parse(work.value.content);
  }
};

const onClickUpdate = () => {
  updateWork();
};

const onClickDelete = () => {
  deleteWork(work.value);
  showMessageModal('삭제 완료');
  setTimeout(() => router.push('/'), 500);
};

const onClickDeleteWorkFile = async (work: WorksResponse) => {
  await pb.collection('works').update(work.id, {
    file: null,
  });
  work.file = '';
};

const onClickCreateScheduledNotification = async () => {
  const result = await pb.collection('scheduledNotifications').create({
    user: pb.authStore.model?.id,
    title: work.value.title,
    time: dayjs(scheduledNotificationTime.value).add(9, 'h').toISOString(),
  } as ScheduledNotificationsRecord);
  await updateWorkByCreateScheduledNotification(result.id);
  await selectWork(work.value.id);
  scheduledNotificationTime.value = '';
};

const onClickDeleteScheduledNotification = async (scheduledNotificationId: string) => {
  await pb.collection('scheduledNotifications').delete(scheduledNotificationId);
  await updateWorkByDeleteScheduledNotification(scheduledNotificationId);
  await selectWork(work.value.id);
};

const selectWork = async (id: string) => {
  work.value = await pb.collection('works').getOne(id, {
    expand: 'scheduledNotifications',
  });
};

const updateWork = async () => {
  const formDate = new FormData();
  for (const [key, value] of Object.entries(work.value)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formDate.append(key, value as any);
  }

  const contentBoxHeight = document.getElementById('textareaView')?.style.height.replace('px', '');
  work.value.contentBoxHeight = Number(contentBoxHeight);
  formDate.delete('contentBoxHeight');
  formDate.append('contentBoxHeight', String(contentBoxHeight));

  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  for (const file of fileInput.files!) {
    formDate.append('file', file);
  }

  await pb.collection('works').update(work.value.id, formDate);
  showMessageModal('수정 완료');

  // 파일 랜더링을 위해 재조회 및 기존 파일 클리어
  await selectWork(work.value.id);
  fileInput.value = '';
};

const updateWorkByCreateScheduledNotification = async (scheduledNotificationId: string) => {
  await pb.collection('works').update(work.value.id, {
    'scheduledNotifications+': scheduledNotificationId,
  });
};

const updateWorkByDeleteScheduledNotification = async (scheduledNotificationId: string) => {
  await pb.collection('works').update(work.value.id, {
    'scheduledNotifications-': scheduledNotificationId,
  });
};
/* ======================= 메서드 ======================= */
</script>
