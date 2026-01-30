import pb from '@/api/pocketbase';
import type {
  ScheduledNotificationsRecord,
  ScheduledNotificationsResponse,
  WorksResponse,
} from '@/api/pocketbase-types';
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
  const createScheduledNotificationInternal = async (data: ScheduledNotificationsRecord) => {
    return await pb.collection('scheduledNotifications').create(data);
  };

  const deleteScheduledNotificationInternal = async (id: string) => {
    return await pb.collection('scheduledNotifications').delete(id);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchRedmineData = (issueId: string) => pb.send(`/api/redmine-data/${issueId}`, {});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateRedmineDataInternal = (data: any) => pb.send('/api/redmine-data', { method: 'POST', body: data });

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
