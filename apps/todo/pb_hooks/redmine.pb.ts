// eslint-disable-next-line @typescript-eslint/triple-slash-reference
// @ts-nocheck
/// <reference path="types.d.ts" />

routerAdd('GET', `/api/redmine-data/{id}`, (e) => {
  const host = 'https://pms.kpcard.co.kr';
  const apiKey = '03e7fa8ea3f2966eae1bc84f54bf8792a128fe0f';
  const id = e.request?.pathValue('id');
  const res = $http.send({
    url: `${host}/issues/${id}.json`,
    headers: {
      'x-redmine-api-key': apiKey,
    },
  });

  return e.json(200, res.json);
});

routerAdd('POST', '/api/redmine-data', (e) => {
  const host = 'https://pms.kpcard.co.kr';
  const apiKey = '03e7fa8ea3f2966eae1bc84f54bf8792a128fe0f';
  const data = new DynamicModel({
    id: '',
    startDate: '',
    dueDate: '',
    doneRatio: 0,
    notes: '',
    watchers: [],
  });

  e.bindBody(data);

  if (!data['id']) {
    return e.error(500, '이슈번호가 존재하지 않습니다.', {});
  }

  /*
  "user": { "id": 48, "name": "심현식" },
  "user": { "id": 38, "name": "남연우" },
  "user": { "id": 60, "name": "차홍국" },
  "user": { "id": 85, "name": "구현정" },
  "user": { "id": 95, "name": "이은지" },
  "user": { "id": 107, "name": "정은지" },
  "user": { "id": 109, "name": "이현기" },
  "user": { "id": 82, "name": "이인석" },
  "user": { "id": 98, "name": "김규영" },
  "user": { "id": 31, "name": "이상호" },
  "user": { "id": 110, "name": "김봉호" },
  "user": { "id": 93, "name": "임소희" },
  "user": { "id": 8, "name": "조성훈" },
  "user": { "id": 6, "name": "최철원" },
  "user": { "id": 118, "name": "최민경" },
  "user": { "id": 122, "name": "장지수" },
  "user": { "id": 123, "name": "조휘서" },
  */
  let watchers = [];
  const watchersMap = {
    cx: [38, 95, 107, 118, 122],
    server: [82, 98, 110, 123],
    client: [31, 93],
    biz: [48, 60, 85, 109],
    manager: [8, 6],
  };
  for (const watcher of data['watchers']) {
    watchers = watchers.concat(watchersMap[watcher]);
  }

  const redmineData = {
    issue: {
      start_date: data['startDate'],
      due_date: data['dueDate'],
      done_ratio: data['doneRatio'],
      notes: data['notes'],
    },
  };

  const res = $http.send({
    url: `${host}/issues/${data['id']}.json`,
    method: 'PUT',
    body: JSON.stringify(redmineData),
    headers: {
      'x-redmine-api-key': apiKey,
      'content-type': 'application/json',
    },
  });

  if (watchers) {
    for (const watcher of watchers) {
      $http.send({
        url: `${host}/issues/${data['id']}/watchers.json`,
        method: 'POST',
        body: JSON.stringify({ user_id: watcher }),
        headers: {
          'x-redmine-api-key': apiKey,
          'content-type': 'application/json',
        },
      });
    }
  }

  return e.noContent(res.statusCode);
});
