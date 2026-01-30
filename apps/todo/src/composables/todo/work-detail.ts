import pb from '@/api/pocketbase';
import type { Create, ScheduledNotificationsResponse, WorksResponse } from '@/api/pocketbase-types';
import { useQuery } from '@tanstack/vue-query';
import { computed, unref, type Ref } from 'vue';

export const useWorkDetail = (workId: string | Ref<string>) => {
  /* ======================= 변수 ======================= */
  const id = computed(() => unref(workId));
  /* ======================= 변수 ======================= */

  /* ======================= 쿼리 ======================= */
  const workQuery = useQuery({
    queryKey: computed(() => ['work', id.value]),
    queryFn: () =>
      pb.collection('works').getOne<
        WorksResponse<{
          scheduledNotifications?: ScheduledNotificationsResponse[];
        }>
      >(id.value, {
        expand: 'scheduledNotifications',
      }),
    enabled: computed(() => !!id.value),
  });
  /* ======================= 쿼리 ======================= */

  /* ======================= 메서드 ======================= */
  const createScheduledNotificationInternal = async (data: Create<'scheduledNotifications'>) => {
    return await pb.collection('scheduledNotifications').create(data);
  };

  const deleteScheduledNotificationInternal = async (id: string) => {
    return await pb.collection('scheduledNotifications').delete(id);
  };

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

  const getWorkFileUrl = (record: WorksResponse, filename: string) => pb.files.getURL(record, filename);
  /* ======================= 메서드 ======================= */

  return {
    workQuery,
    createScheduledNotification: createScheduledNotificationInternal,
    deleteScheduledNotification: deleteScheduledNotificationInternal,
    fetchRedmineData,
    updateRedmineData: updateRedmineDataInternal,
    getWorkFileUrl,
  };
};
