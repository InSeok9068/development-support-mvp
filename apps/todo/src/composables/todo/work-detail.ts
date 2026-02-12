import pb from '@/api/pocketbase';
import {
  Collections,
  type Create,
  type ScheduledNotificationsResponse,
  type WorksResponse,
} from '@/api/pocketbase-types';
import { useMutation, useQuery } from '@tanstack/vue-query';
import { computed, unref, type Ref } from 'vue';

export const useWorkDetail = (workId: string | Ref<string>) => {
  /* ======================= 변수 ======================= */
  const id = computed(() => unref(workId));
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 메서드 ======================= */
  const workQuery = useQuery({
    queryKey: computed(() => ['works', 'detail', id.value] as const),
    queryFn: () =>
      pb.collection(Collections.Works).getOne<
        WorksResponse<{
          scheduledNotifications?: ScheduledNotificationsResponse[];
        }>
      >(id.value, {
        expand: 'scheduledNotifications',
      }),
    enabled: computed(() => !!id.value),
  });
  const work = computed(() => workQuery.data.value);

  const refetchWorkDetail = () => workQuery.refetch();

  const createScheduledNotificationMutation = useMutation({
    mutationFn: (data: Create<Collections.ScheduledNotifications>) =>
      pb.collection(Collections.ScheduledNotifications).create(data),
  });

  const deleteScheduledNotificationMutation = useMutation({
    mutationFn: (id: string) => pb.collection(Collections.ScheduledNotifications).delete(id),
  });

  const createScheduledNotificationInternal = (data: Create<Collections.ScheduledNotifications>) =>
    createScheduledNotificationMutation.mutateAsync(data);

  const deleteScheduledNotificationInternal = (id: string) => deleteScheduledNotificationMutation.mutateAsync(id);

  const fetchRedmineData = (issueId: string) => pb.send(`/api/redmine-data/${issueId}`, {});

  interface RedmineUpdateData {
    id: string;
    startDate: string;
    dueDate: string;
    doneRatio: number;
    notes: string;
    watchers: string[];
  }

  const updateRedmineDataInternal = (data: RedmineUpdateData) =>
    pb.send('/api/redmine-data', { method: 'POST', body: data });

  const buildWorkUpdatePayload = (work: WorksResponse, files?: FileList | null) => {
    const payload = new FormData();
    payload.append('title', work.title ?? '');
    payload.append('done', String(work.done ?? false));
    payload.append('doneDate', work.doneDate ?? '');
    payload.append('state', work.state ?? '');
    payload.append('content', work.content ?? '');
    payload.append('redmine', work.redmine ?? '');
    payload.append('joplin', work.joplin ?? '');
    payload.append('developer', work.developer ?? '');
    payload.append('dueDate', work.dueDate ?? '');

    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
        payload.append('file', file);
      }
    }

    return payload;
  };

  const getWorkFileUrl = (record: WorksResponse, filename: string) => pb.files.getURL(record, filename);
  /* ======================= 메서드 ======================= */

  return {
    work,
    refetchWorkDetail,
    createScheduledNotification: createScheduledNotificationInternal,
    deleteScheduledNotification: deleteScheduledNotificationInternal,
    fetchRedmineData,
    updateRedmineData: updateRedmineDataInternal,
    buildWorkUpdatePayload,
    getWorkFileUrl,
  };
};
