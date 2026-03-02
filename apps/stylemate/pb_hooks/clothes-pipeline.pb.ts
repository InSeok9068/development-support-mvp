// @ts-nocheck

onRecordAfterCreateSuccess(
  (e) => {
    const { processClothesPipeline } = require(`${__hooks}/clothes-pipeline-service.ts`);
    processClothesPipeline(e.record.id);
  },
  'clothes',
);

onRecordAfterUpdateSuccess(
  (e) => {
    if ('uploaded' !== String(e.record.get('state') ?? '')) {
      return;
    }

    const { processClothesPipeline } = require(`${__hooks}/clothes-pipeline-service.ts`);
    processClothesPipeline(e.record.id);
  },
  'clothes',
);

routerAdd(
  'POST',
  '/api/clothes/upload-url',
  (e) => {
    const payload = new DynamicModel({
      sourceUrl: '',
    });
    e.bindBody(payload);

    const { createClothesByUrl } = require(`${__hooks}/clothes-pipeline-service.ts`);
    const result = createClothesByUrl(e.auth, payload.sourceUrl);
    if (!result.ok) {
      return e.error(result.statusCode, result.message, {});
    }

    return e.json(200, {
      id: result.record.id,
      retryCount: result.record.get('retryCount'),
      sourceType: result.record.get('sourceType'),
      sourceUrl: result.record.get('sourceUrl'),
      state: result.record.get('state'),
    });
  },
  $apis.requireAuth(),
);

routerAdd(
  'POST',
  '/api/clothes/reembed/{id}',
  (e) => {
    const clothesId = String(e.request.pathValue('id') ?? '').trim();
    if (!clothesId) {
      return e.error(400, 'clothes id가 필요합니다.', {});
    }

    const { reembedClothesById } = require(`${__hooks}/clothes-pipeline-service.ts`);
    const result = reembedClothesById(e.auth, clothesId);
    if (!result.ok) {
      return e.error(result.statusCode, result.message, {});
    }

    return e.json(200, {
      embeddingModel: result.record.get('embeddingModel'),
      id: result.record.id,
      state: result.record.get('state'),
    });
  },
  $apis.requireAuth(),
);

routerAdd(
  'POST',
  '/api/clothes/retry/{id}',
  (e) => {
    const clothesId = String(e.request.pathValue('id') ?? '').trim();
    if (!clothesId) {
      return e.error(400, 'clothes id가 필요합니다.', {});
    }

    const { retryClothesById } = require(`${__hooks}/clothes-pipeline-service.ts`);
    const result = retryClothesById(e.auth, clothesId);
    if (!result.ok) {
      return e.error(result.statusCode, result.message, {});
    }

    return e.json(200, {
      id: result.record.id,
      retryCount: result.record.get('retryCount'),
      state: result.record.get('state'),
    });
  },
  $apis.requireAuth(),
);

routerAdd(
  'DELETE',
  '/api/clothes/delete/{id}',
  (e) => {
    const clothesId = String(e.request.pathValue('id') ?? '').trim();
    if (!clothesId) {
      return e.error(400, 'clothes id가 필요합니다.', {});
    }

    const { deleteClothesById } = require(`${__hooks}/clothes-pipeline-service.ts`);
    const result = deleteClothesById(e.auth, clothesId);
    if (!result.ok) {
      return e.error(result.statusCode, result.message, {});
    }

    return e.json(200, result.payload);
  },
  $apis.requireAuth(),
);
