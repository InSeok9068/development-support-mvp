// eslint-disable-next-line @typescript-eslint/triple-slash-reference
// @ts-nocheck
/// <reference path="types.d.ts" />

// 시간은 UTC 9시간차 고려해서 -9

// 주간보고서 매주 금요일 오전 10시
cronAdd('주간보고서 작성', '0 1 * * 5', () => {
  const wokrs = $app.findCollectionByNameOrId('works');
  const scheduledNotifications = $app.findCollectionByNameOrId('scheduledNotifications');
  const user = 'hyzwag0k7gxnc31';
  const title = '주간보고서 작성';

  $app.save(
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

  $app.save(
    new Record(scheduledNotifications, {
      user: user,
      title: title,
      time: new Date(),
    }),
  );
});

// 주간보고서 매주 금요일 오후 2시
cronAdd('주간보고서 리뷰', '0 5 * * 5', () => {
  const wokrs = $app.findCollectionByNameOrId('works');
  const scheduledNotifications = $app.findCollectionByNameOrId('scheduledNotifications');
  const user = 'hyzwag0k7gxnc31';
  const title = '주간보고서 리뷰';

  $app.save(
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

  $app.save(
    new Record(scheduledNotifications, {
      user: user,
      title: title,
      time: new Date(),
    }),
  );
});

// 월간보고서 매월 5일 오전 10시
cronAdd('월간보고서 작성', '0 1 5 * *', () => {
  const wokrs = $app.findCollectionByNameOrId('works');
  const scheduledNotifications = $app.findCollectionByNameOrId('scheduledNotifications');
  const user = 'hyzwag0k7gxnc31';
  const title = '월간보고서 작성';

  $app.save(
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

  $app.save(
    new Record(scheduledNotifications, {
      user: user,
      title: title,
      time: new Date(),
    }),
  );
});

// K-Tree 매월 1일 오전 10시
cronAdd('K-Tree 작성', '0 1 1 * *', () => {
  const wokrs = $app.findCollectionByNameOrId('works');
  const scheduledNotifications = $app.findCollectionByNameOrId('scheduledNotifications');
  const user = 'hyzwag0k7gxnc31';
  const title = 'K-Tree 작성';

  $app.save(
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

  $app.save(
    new Record(scheduledNotifications, {
      user: user,
      title: title,
      time: new Date(),
    }),
  );
});

// PG 결제 불일치 건 조회 매월 30일 오전 10시
cronAdd('PG 결제 불일치 건 조회', '0 1 30 * *', () => {
  const wokrs = $app.findCollectionByNameOrId('works');
  const scheduledNotifications = $app.findCollectionByNameOrId('scheduledNotifications');
  const user = 'hyzwag0k7gxnc31';
  const title = 'PG 결제 불일치 건 조회';

  $app.save(
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

  $app.save(
    new Record(scheduledNotifications, {
      user: user,
      title: title,
      time: new Date(),
    }),
  );
});
