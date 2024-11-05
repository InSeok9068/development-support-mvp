// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="types.d.ts" />

// 시간은 UTC 9시간차 고려해서 -9

// 주간보고서 매주 금요일 오전 10시
cronAdd('주간보고서 작성', '0 1 * * 5', () => {
  const wokrs = $app.dao().findCollectionByNameOrId('works');
  const scheduledNotifications = $app.dao().findCollectionByNameOrId('scheduledNotifications');
  const user = 'hyzwag0k7gxnc31';
  const title = '주간보고서 작성';

  $app.dao().saveRecord(
    new Record(wokrs, {
      user: user,
      title: title,
      content: '',
      time: 0,
      done: false,
      developer: '0d6t74mv8rehja5',
      dueDate: new Date(),
    }),
  );

  $app.dao().saveRecord(
    new Record(scheduledNotifications, {
      user: user,
      title: title,
      time: new Date(),
    }),
  );
});

// 월간보고서 매월 5일 오전 10시
cronAdd('월간보고서 작성', '0 1 5 * *', () => {
  const wokrs = $app.dao().findCollectionByNameOrId('works');
  const scheduledNotifications = $app.dao().findCollectionByNameOrId('scheduledNotifications');
  const user = 'hyzwag0k7gxnc31';
  const title = '월간보고서 작성';

  $app.dao().saveRecord(
    new Record(wokrs, {
      user: user,
      title: title,
      content: '',
      time: 0,
      done: false,
      developer: '0d6t74mv8rehja5',
      dueDate: new Date(),
    }),
  );

  $app.dao().saveRecord(
    new Record(scheduledNotifications, {
      user: user,
      title: title,
      time: new Date(),
    }),
  );
});

// K-Tree 매월 1일 오전 10시
cronAdd('K-Tree 작성', '0 1 1 * *', () => {
  const wokrs = $app.dao().findCollectionByNameOrId('works');
  const scheduledNotifications = $app.dao().findCollectionByNameOrId('scheduledNotifications');
  const user = 'hyzwag0k7gxnc31';
  const title = 'K-Tree 작성';

  $app.dao().saveRecord(
    new Record(wokrs, {
      user: user,
      title: title,
      content: '',
      time: 0,
      done: false,
      developer: '0d6t74mv8rehja5',
      dueDate: new Date(),
    }),
  );

  $app.dao().saveRecord(
    new Record(scheduledNotifications, {
      user: user,
      title: title,
      time: new Date(),
    }),
  );
});

// PG 결제 불일치 건 조회 매월 30일 오전 10시
cronAdd('PG 결제 불일치 건 조회', '0 1 30 * *', () => {
  const wokrs = $app.dao().findCollectionByNameOrId('works');
  const scheduledNotifications = $app.dao().findCollectionByNameOrId('scheduledNotifications');
  const user = 'hyzwag0k7gxnc31';
  const title = 'PG 결제 불일치 건 조회';

  $app.dao().saveRecord(
    new Record(wokrs, {
      user: user,
      title: title,
      content: '',
      time: 0,
      done: false,
      developer: '0d6t74mv8rehja5',
      dueDate: new Date(),
    }),
  );

  $app.dao().saveRecord(
    new Record(scheduledNotifications, {
      user: user,
      title: title,
      time: new Date(),
    }),
  );
});
