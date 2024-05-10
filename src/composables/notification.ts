import pb from '@/api/pocketbase';

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

  return {
    notificationSubscribe,
  };
};
