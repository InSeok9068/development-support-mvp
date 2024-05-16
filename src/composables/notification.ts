import pb from '@/api/pocketbase';
import type { ScheduledNotificationsRecord } from '@/api/pocketbase-types';

export const useNotification = () => {
  const notificationSubscribe = (on: boolean = true) => {
    if (on) {
      pb.collection('notifications').subscribe('*', (e) => {
        switch (e.action) {
          case 'create':
            new Notification(e.record.title, {
              body: e.record.message,
            });
        }
      });
    } else {
      pb.collection('notifications').unsubscribe('*');
    }
  };

  const createNotification = (notification: ScheduledNotificationsRecord) => {
    pb.collection('scheduledNotifications').create({
      ...{
        user: pb.authStore.model?.id,
        title: '알림',
        scheduledTime: new Date(),
      },
      ...notification,
    });
  };

  return {
    createNotification,
    notificationSubscribe,
  };
};
