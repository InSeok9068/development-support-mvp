import pb from '@/api/pocketbase';
import dayjs from 'dayjs';

export const useNotification = () => {
  const subscribeNotification = (on: boolean = true) => {
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

  const subscribeScheduledNotifications = (on: boolean = true) => {
    if (on) {
      // 1분 마다 확인
      setInterval(async () => {
        const scheduledNotifications = await pb.collection('scheduledNotifications').getFullList({
          filter: `time ~ '${dayjs().format('YYYY-MM-DD HH:MM')}'`,
          sort: 'created',
        });

        scheduledNotifications.forEach((record) => {
          pb.collection('scheduledNotifications').delete(record.id);
          pb.collection('notifications').create(record);
        });
      }, 1000 * 60);
    }
  };

  return {
    subscribeNotification,
    subscribeScheduledNotifications,
  };
};
