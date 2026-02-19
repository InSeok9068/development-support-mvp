<template>
  <main class="container mx-auto px-3 py-4 lg:px-4">
    <sl-card class="w-full shadow-sm">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center gap-2">
            <sl-tag size="small">업무 상세</sl-tag>
            <div class="ml-auto flex flex-wrap items-center gap-2">
              <sl-button size="small" variant="primary" @click="onClickUpdate()">
                <sl-icon name="floppy" class="mr-2"></sl-icon>
                저장
              </sl-button>
              <sl-button size="small" variant="default" @click="onClickDelete()">
                <sl-icon name="trash" class="mr-2 text-slate-500"></sl-icon>
                삭제
              </sl-button>
            </div>
          </div>
          <sl-input
            v-model="work.title"
            class="w-full max-w-none text-xl font-semibold sm:text-2xl"
            size="large"
            placeholder="제목을 입력하세요"
          ></sl-input>
        </div>

        <div class="flex flex-col gap-5 lg:flex-row">
          <div class="flex flex-col gap-4 lg:flex-1">
            <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <h5 class="font-semibold">진행 상태</h5>
                <div class="ml-auto flex items-center gap-2 text-sm text-slate-600">
                  <span>완료</span>
                  <sl-switch :checked="work.done" size="small" @sl-change="onChangeDone"></sl-switch>
                </div>
              </div>
              <div class="pb-1">
                <sl-radio-group :value="work.state" size="small" @sl-change="onChangeWorkState">
                  <div class="flex flex-wrap gap-2 text-xs">
                    <template v-for="state in getCodesByType('workState')" :key="state.value">
                      <sl-radio-button :value="state.value">
                        {{ state.desc }}
                        <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                        <sl-icon slot="suffix" :name="state.class"></sl-icon>
                      </sl-radio-button>
                    </template>
                  </div>
                </sl-radio-group>
              </div>
            </div>

            <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <h5 class="font-semibold">내용</h5>
                <sl-copy-button class="ml-auto" size="small" :value="markdownContent"> 마크다운 복사 </sl-copy-button>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-2">
                <DetailEditor v-model="work.content" />
              </div>
            </div>

            <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <div>
                  <h5 class="font-semibold">레드마인</h5>
                  <a href="https://pms.kpcard.co.kr/projects/palrago/issues/new" target="_blank" class="text-xs">
                    (+)일감 생성
                  </a>
                </div>
                <sl-button
                  v-show="work.redmine"
                  class="ml-auto"
                  size="small"
                  variant="text"
                  @click="onClickRedmine(work.redmine)"
                >
                  열기
                </sl-button>
              </div>
              <div class="grid gap-3">
                <sl-input v-model="work.redmine" type="url" placeholder="레드마인 URL"></sl-input>
                <sl-details v-show="work.redmine" summary="레드마인 더보기">
                  <div class="mt-3 flex flex-col gap-4">
                    <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div class="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <sl-icon name="people"></sl-icon>
                        일감 관리자 추가
                      </div>
                      <div class="flex flex-wrap gap-3">
                        <sl-checkbox
                          :checked="redmineData.watchers.includes('cx')"
                          value="cx"
                          @sl-change="onChangeWatcher"
                        >
                          CX팀
                        </sl-checkbox>
                        <sl-checkbox
                          :checked="redmineData.watchers.includes('server')"
                          value="server"
                          @sl-change="onChangeWatcher"
                        >
                          개발팀(서버)
                        </sl-checkbox>
                        <sl-checkbox
                          :checked="redmineData.watchers.includes('client')"
                          value="client"
                          @sl-change="onChangeWatcher"
                        >
                          개발팀(클라이언트)
                        </sl-checkbox>
                        <sl-checkbox
                          :checked="redmineData.watchers.includes('biz')"
                          value="biz"
                          @sl-change="onChangeWatcher"
                        >
                          사업팀
                        </sl-checkbox>
                        <sl-checkbox
                          :checked="redmineData.watchers.includes('manager')"
                          value="manager"
                          @sl-change="onChangeWatcher"
                        >
                          관리자
                        </sl-checkbox>
                      </div>
                    </div>

                    <div class="grid gap-3 sm:grid-cols-2">
                      <sl-input v-model="redmineData.startDate" type="date" label="시작일자"></sl-input>
                      <sl-input v-model="redmineData.dueDate" type="date" label="종료일자"></sl-input>
                    </div>

                    <div class="rounded-lg border border-slate-200 bg-white p-3">
                      <div class="mb-2 flex items-center justify-between text-sm">
                        <span class="font-semibold">진척도</span>
                        <sl-tag size="small">{{ redmineData.doneRatio }}%</sl-tag>
                      </div>
                      <sl-range
                        :value="redmineData.doneRatio"
                        :min="0"
                        :max="100"
                        :step="10"
                        @sl-change="onChangeRedmineDoneRatio"
                      ></sl-range>
                    </div>

                    <sl-textarea v-model="redmineData.notes" label="댓글 작성" resize="auto"></sl-textarea>

                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <sl-button size="small" variant="default" @click="onClickSelectRedmineData">불러오기</sl-button>
                      <sl-button size="small" variant="primary" @click="onClickUpdateRedmineData">업데이트</sl-button>
                    </div>
                  </div>
                </sl-details>
              </div>
            </div>

            <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <h5 class="font-semibold">조플린</h5>
                <sl-button
                  v-show="work.joplin"
                  class="ml-auto"
                  size="small"
                  variant="text"
                  @click="onClickJoplin(work.joplin)"
                >
                  열기
                </sl-button>
              </div>
              <sl-input v-model="work.joplin" type="url" placeholder="조플린 URL"></sl-input>
            </div>
          </div>

          <div class="flex flex-col gap-4 lg:sticky lg:top-4 lg:h-fit lg:w-80 lg:flex-shrink-0">
            <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <h5 class="font-semibold">담당 정보</h5>
                <sl-button class="ml-auto" size="small" variant="text" @click.stop.prevent="onClickRemoveDeveloper">
                  <sl-icon name="person-fill-dash" class="mr-1"></sl-icon>
                  해제
                </sl-button>
              </div>
              <div class="grid gap-3">
                <sl-select
                  :value="work.developer"
                  label="개발자"
                  placeholder="개발자 선택"
                  @sl-change="onChangeDeveloper"
                >
                  <template v-for="developer in developers" :key="developer.id">
                    <sl-option :value="developer.id" :selected="work.developer == developer.id">
                      <span>{{ developer.name }}</span>
                    </sl-option>
                  </template>
                </sl-select>
                <sl-input
                  label="마감일시"
                  :value="dayjs(work.dueDate).format('YYYY-MM-DD')"
                  type="date"
                  @sl-input="onInputDueDate"
                ></sl-input>
              </div>
            </div>

            <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div class="mb-3">
                <h5 class="font-semibold">미리알람</h5>
                <p class="text-sm text-slate-500">업무 시작 전에 받을 알람 시간을 등록하세요.</p>
              </div>
              <div class="flex items-center gap-2">
                <sl-input v-model="scheduledNotificationTime" type="datetime-local" class="min-w-0 flex-1"></sl-input>
                <sl-button
                  class="shrink-0"
                  variant="default"
                  aria-label="미리알람 추가"
                  title="미리알람 추가"
                  @click="onClickCreateScheduledNotification"
                >
                  <sl-icon name="plus-lg"></sl-icon>
                </sl-button>
              </div>
              <div v-show="(work.expand?.scheduledNotifications ?? []).length === 0" class="mt-3">
                <sl-tag size="small">등록된 알람이 없습니다</sl-tag>
              </div>
              <div v-show="(work.expand?.scheduledNotifications ?? []).length > 0" class="mt-3 grid gap-2">
                <div
                  v-for="scheduledNotification in work.expand?.scheduledNotifications"
                  :key="scheduledNotification.id"
                  class="flex items-center gap-2 rounded-md border p-2"
                >
                  <sl-tag size="small">알람시간</sl-tag>
                  <span class="min-w-0 flex-1 text-sm font-semibold">
                    {{ dayjs(scheduledNotification.time).subtract(9, 'h').format('YYYY-MM-DD HH:mm:ss') }}
                  </span>
                  <sl-button
                    size="small"
                    variant="text"
                    @click="onClickDeleteScheduledNotification(scheduledNotification.id)"
                  >
                    삭제
                  </sl-button>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h5 class="mb-3 font-semibold">첨부파일</h5>
              <div class="flex flex-wrap items-center gap-2">
                <sl-button size="small" variant="default" @click="onClickSelectFile">
                  <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                  <sl-icon slot="prefix" name="paperclip"></sl-icon>
                  파일 선택
                </sl-button>
                <input id="fileInput" ref="fileInput" type="file" class="hidden" @change="onChangeFileInput" />
              </div>
              <div v-show="selectedFileName" class="mt-3">
                <sl-tag size="small">선택한 파일: {{ selectedFileName }}</sl-tag>
              </div>
              <div v-show="work.file" class="mt-3 flex items-center gap-2">
                <a :href="getWorkFileUrl(work, work.file)" target="_blank">
                  {{ work.originalFileName || work.file }}
                </a>
                <sl-icon
                  name="trash"
                  class="cursor-pointer"
                  @click.stop.prevent="onClickDeleteWorkFile(work)"
                ></sl-icon>
              </div>
            </div>

            <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h5 class="mb-3 font-semibold">기록</h5>
              <div class="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                <sl-input
                  label="완료일시"
                  readonly
                  :value="work.doneDate && dayjs(work.doneDate).format('YYYY-MM-DD HH:mm:ss')"
                ></sl-input>
                <sl-input
                  label="등록일시"
                  readonly
                  :value="dayjs(work.created).format('YYYY-MM-DD HH:mm:ss')"
                ></sl-input>
                <sl-input
                  label="수정일시"
                  readonly
                  :value="dayjs(work.updated).format('YYYY-MM-DD HH:mm:ss')"
                ></sl-input>
              </div>
            </div>
          </div>
        </div>
      </div>
    </sl-card>
  </main>
</template>

<script setup lang="ts">
import type { ScheduledNotificationsResponse, WorksResponse } from '@/api/pocketbase-types';
import DetailEditor from '@/components/detail/DetailEditor.vue';
import { useCode } from '@/composables/code';
import { useDeveloper } from '@/composables/todo/developer';
import { useWork } from '@/composables/todo/work';
import { useWorkDetail } from '@/composables/todo/work-detail';
import { useToast } from '@/composables/toast';
import { useSign } from '@/composables/user/sign';
import { readShoelaceChecked, readShoelaceSingleValue, useModal } from '@packages/ui';
import { useMagicKeys } from '@vueuse/core';
import dayjs from 'dayjs';
import TurndownService from 'turndown';
import { computed, onMounted, ref, toRaw, watch } from 'vue';
import { type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const route = useRoute() as RouteLocationNormalizedLoaded<'/detail/[id]'>;
const {
  work: workDetail,
  refetchWorkDetail,
  createScheduledNotification,
  deleteScheduledNotification,
  fetchRedmineData: requestFetchRedmineData,
  updateRedmineData: requestUpdateRedmineData,
  buildWorkUpdatePayload,
  getWorkFileUrl,
} = useWorkDetail(computed(() => route.params.id));
const { deleteWork, updateWork } = useWork();
const { getCodesByType } = useCode();
const { showMessageModal, showConfirmModal } = useModal();
const { showMessageToast } = useToast();
const { developers, fetchDeveloperList } = useDeveloper();
const { getUserId } = useSign();
const router = useRouter();
const keys = useMagicKeys();
const scheduledNotificationTime = ref<string>('');
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFileName = ref<string>('');
const work = ref<
  WorksResponse<{
    scheduledNotifications?: ScheduledNotificationsResponse[];
  }>
>(
  {} as WorksResponse<{
    scheduledNotifications?: ScheduledNotificationsResponse[];
  }>,
);
const redmineData = ref<{
  id: string;
  startDate: string;
  dueDate: string;
  doneRatio: number;
  notes: string;
  watchers: string[];
}>({
  id: '',
  startDate: '',
  dueDate: '',
  doneRatio: 0,
  notes: '',
  watchers: [],
});
const markdownContent = computed(() => {
  if (!work.value.content) {
    return '';
  }
  const turndownService = new TurndownService();
  return turndownService.turndown(work.value.content);
});
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(keys.alt_s, (v) => v && updateWorkDetail());
watch(
  () => workDetail.value,
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
const onClickSelectFile = () => {
  fileInput.value?.click();
};

const onChangeFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  selectedFileName.value = file?.name ?? '';
};

const onChangeDone = (event: Event) => {
  work.value.done = readShoelaceChecked(event);
  if (work.value.done) {
    work.value.doneDate = new Date().toISOString();
    work.value.state = 'done';
  } else {
    work.value.doneDate = '';
    work.value.state = 'wait';
  }
};

const onChangeWorkState = (event: Event) => {
  work.value.state = readShoelaceSingleValue(event);
};

const onChangeDeveloper = (event: Event) => {
  work.value.developer = readShoelaceSingleValue(event);
};

const onChangeWatcher = (event: Event) => {
  const value = readShoelaceSingleValue(event);
  if (!value) {
    return;
  }

  const watchers = [...redmineData.value.watchers];
  const index = watchers.indexOf(value);
  const isChecked = readShoelaceChecked(event);

  if (isChecked && index === -1) {
    watchers.push(value);
  }
  if (!isChecked && index !== -1) {
    watchers.splice(index, 1);
  }

  redmineData.value.watchers = watchers;
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
  showConfirmModal({
    title: '삭제 확인',
    message: '해당 업무를 삭제할까요?',
    onConfirm: async () => {
      await deleteWork(work.value);
      showMessageToast('삭제되었습니다.');
      await router.replace('/');
    },
  });
};

const onClickDeleteWorkFile = async (work: WorksResponse) => {
  await updateWork(work.id, {
    file: null,
    originalFileName: '',
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
  await refetchWorkDetail();
  scheduledNotificationTime.value = '';
};

const onClickDeleteScheduledNotification = async (scheduledNotificationId: string) => {
  await deleteScheduledNotification(scheduledNotificationId);
  await updateWorkByDeleteScheduledNotification(scheduledNotificationId);
  await refetchWorkDetail();
};

const onClickRemoveDeveloper = () => {
  work.value.developer = '';
};

const onInputDueDate = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  work.value.dueDate = target?.value ?? '';
};

const updateWorkDetail = async () => {
  const payload = buildWorkUpdatePayload(work.value, fileInput.value?.files ?? null);
  await updateWork(work.value.id, payload);
  showMessageModal('수정 완료');

  // 파일 랜더링을 위해 재조회 및 기존 파일 클리어
  await refetchWorkDetail();
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  selectedFileName.value = '';
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

const onClickSelectRedmineData = () => selectRedmineData();

const onClickUpdateRedmineData = () => updateRedmineData();

const onChangeRedmineDoneRatio = (event: Event) => {
  redmineData.value.doneRatio = Number(readShoelaceSingleValue(event) || 0);
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
