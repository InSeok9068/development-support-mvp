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
            <h4><i class="bi-floppy cursor-pointer" @click="onClickUpdate()"></i></h4>
          </li>
          <li>
            <h4><i class="bi-trash cursor-pointer" @click="onClickDelete()"></i></h4>
          </li>
        </ul>
      </nav>

      <input v-model="work.title" class="text-lg sm:text-2xl" />

      <div class="grid" role="group">
        <label>
          완료여부
          <input v-model="work.done" type="checkbox" role="switch" @change="onChangeDone" />
        </label>
      </div>

      <div class="grid gap-3" role="group">
        <template v-for="state in getCodesByType('workState')">
          <label>
            <i class="mr-1 hidden sm:inline" :class="state.class"></i>
            <span class="mr-1">{{ state.desc }}</span>
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
        <i class="bi-copy float-right cursor-pointer" @click.stop.prevent="onClickMarkdownCopy">마크다운 복사</i>
        <div role="group">
          <DetailEditor v-model="work.content" />
        </div>
      </label>

      <label class="w-auto!">
        <strong>레드마인 URL</strong> >
        <a href="https://pms.kpcard.co.kr/projects/palrago/issues/new" target="_blank"> (+)일감 생성 </a>
        <div role="group">
          <input v-model="work.redmine" type="url" />
          <button v-show="work.redmine" @click="onClickRedmine(work.redmine)">OPEN</button>
        </div>
        <details v-show="work.redmine">
          <summary role="button" class="outline" @click="selectRedmineData">레드마인 더보기</summary>
          <article>
            <fieldset>
              <legend>일감 관리자 추가</legend>
              <input id="cx" v-model="redmineData.watchers" type="checkbox" name="assigned" value="cx" />
              <label htmlFor="cx">CX팀</label>
              <input id="dev" v-model="redmineData.watchers" type="checkbox" name="assigned" value="server" />
              <label htmlFor="dev">개발팀(서버)</label>
              <input id="dev" v-model="redmineData.watchers" type="checkbox" name="assigned" value="client" />
              <label htmlFor="dev">개발팀(클라이언트)</label>
              <input id="biz" v-model="redmineData.watchers" type="checkbox" name="assigned" value="biz" />
              <label htmlFor="biz">사업팀</label>
              <input id="manager" v-model="redmineData.watchers" type="checkbox" name="assigned" value="manager" />
              <label htmlFor="manager">관리자</label>
            </fieldset>
            <label>
              시작일자
              <input v-model="redmineData.startDate" type="date" />
            </label>
            <label>
              종료일자
              <input v-model="redmineData.dueDate" type="date" />
            </label>
            <label>
              진척도 <span class="font-bold" v-text="redmineData.doneRatio"></span>%
              <input v-model="redmineData.doneRatio" type="range" min="0" max="100" step="10" />
            </label>
            <label>
              댓글 작성
              <textarea v-model="redmineData.notes" />
            </label>
            <div role="group">
              <button class="secondary" @click="selectRedmineData">불러오기</button>
              <button class="contrast" @click="updateRedmineData">업데이트</button>
            </div>
          </article>
        </details>
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
        <i class="bi-person-fill-dash float-right cursor-pointer" @click.stop.prevent="onClickRemoveDeveloper">삭제</i>
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
                  class="bi-trash ml-1 cursor-pointer"
                  @click.stop.prevent="onClickDeleteScheduledNotification(scheduledNotification.id)"
                ></i>
              </td>
            </tr>
          </tbody>
        </table>
      </label>

      <!-- TODO Multiple 파일 업로드 기능 검토 -->
      <strong>첨부파일</strong>
      <input id="fileInput" type="file" class="block w-[unset]!" />
      <div v-show="work.file" class="mb-5">
        <a :href="getWorkFileUrl(work, work.file)" target="_blank">
          {{ work.file }}
        </a>
        <i class="bi-trash ml-5 cursor-pointer" @click.stop.prevent="onClickDeleteWorkFile(work)"></i>
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
import type { ScheduledNotificationsResponse, WorksResponse } from '@/api/pocketbase-types';
import DetailEditor from '@/components/detail/DetailEditor.vue';
import { useCode } from '@/composables/code';
import { useDeveloper } from '@/composables/todo/developer';
import { useWork } from '@/composables/todo/work';
import { useWorkDetail } from '@/composables/todo/work-detail';
import { useSign } from '@/composables/user/sign';
import { useModal } from '@packages/ui';
import { useMagicKeys } from '@vueuse/core';
import dayjs from 'dayjs';
import TurndownService from 'turndown';
import { computed, onMounted, ref, toRaw, watch } from 'vue';
import { type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const route = useRoute() as RouteLocationNormalizedLoaded<'/detail/[id]'>;
const {
  workQuery,
  createScheduledNotification,
  deleteScheduledNotification,
  fetchRedmineData: requestFetchRedmineData,
  updateRedmineData: requestUpdateRedmineData,
  getWorkFileUrl,
} = useWorkDetail(computed(() => route.params.id));
const { deleteWork, updateWork } = useWork();
const { getCodesByType } = useCode();
const { showMessageModal } = useModal();
const { developers, fetchDeveloperList } = useDeveloper();
const { getUserId } = useSign();
const router = useRouter();
const keys = useMagicKeys();
const scheduledNotificationTime = ref<string>('');
const work = ref<
  WorksResponse<{
    scheduledNotifications?: ScheduledNotificationsResponse[];
  }>
>(
  {} as WorksResponse<{
    scheduledNotifications?: ScheduledNotificationsResponse[];
  }>,
);
const redmineData = ref({
  id: '',
  startDate: '',
  dueDate: '',
  doneRatio: 0,
  notes: '',
  watchers: [],
});
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(keys.alt_s, (v) => v && updateWorkDetail());
watch(
  () => workQuery.data.value,
  (data) => {
    if (data) {
      work.value = structuredClone(toRaw(data));
    }
  },
  { immediate: true },
);
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  fetchDeveloperList();
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

const onClickUpdate = () => {
  updateWorkDetail();
};

const onClickDelete = () => {
  deleteWork(work.value);
  showMessageModal('삭제 완료');
  setTimeout(() => router.push('/'), 500);
};

const onClickDeleteWorkFile = async (work: WorksResponse) => {
  await updateWork(work.id, {
    file: null,
  });
  // work.file = '';
};

const onClickCreateScheduledNotification = async () => {
  const result = await createScheduledNotification({
    user: getUserId(),
    title: work.value.title,
    time: dayjs(scheduledNotificationTime.value).add(9, 'h').toISOString(),
  });
  await updateWorkByCreateScheduledNotification(result.id);
  await workQuery.refetch();
  scheduledNotificationTime.value = '';
};

const onClickDeleteScheduledNotification = async (scheduledNotificationId: string) => {
  await deleteScheduledNotification(scheduledNotificationId);
  await updateWorkByDeleteScheduledNotification(scheduledNotificationId);
  await workQuery.refetch();
};

const onClickMarkdownCopy = () => {
  const turndownService = new TurndownService();
  navigator.clipboard.writeText(turndownService.turndown(work.value.content));
  alert('복사완료');
};

const onClickRemoveDeveloper = () => {
  work.value.developer = '';
};

const updateWorkDetail = async () => {
  const formDate = new FormData();
  for (const [key, value] of Object.entries(work.value)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formDate.append(key, value as any);
  }

  // 스케줄 업데이트는 따로 처리
  formDate.delete('scheduledNotifications');

  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  for (const file of fileInput.files!) {
    formDate.append('file', file);
  }

  await updateWork(work.value.id, formDate);
  showMessageModal('수정 완료');

  // 파일 랜더링을 위해 재조회 및 기존 파일 클리어
  await workQuery.refetch();
  fileInput.value = '';
};

const updateWorkByCreateScheduledNotification = async (scheduledNotificationId: string) => {
  await updateWork(work.value.id, {
    'scheduledNotifications+': scheduledNotificationId,
  });
};

const updateWorkByDeleteScheduledNotification = async (scheduledNotificationId: string) => {
  await updateWork(work.value.id, {
    'scheduledNotifications-': scheduledNotificationId,
  });
};

const selectRedmineData = async () => {
  const re = /\/issues\/(\d+)(?=[/?#]|$)/;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = await requestFetchRedmineData(work.value.redmine.match(re)?.[1] ?? '');

  redmineData.value.startDate = res['issue']['start_date'];
  redmineData.value.dueDate = res['issue']['due_date'];
  redmineData.value.doneRatio = res['issue']['done_ratio'];
};

const updateRedmineData = async () => {
  const re = /\/issues\/(\d+)(?=[/?#]|$)/;
  redmineData.value.id = work.value.redmine.match(re)?.[1] ?? '';
  redmineData.value.doneRatio = Number(redmineData.value.doneRatio);

  await requestUpdateRedmineData(redmineData.value);

  await selectRedmineData();
  redmineData.value.notes = '';
  redmineData.value.watchers = [];

  showMessageModal('레드마인 동기화 완료');
};
/* ======================= 메서드 ======================= */
</script>
