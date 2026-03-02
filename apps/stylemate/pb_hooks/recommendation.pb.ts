// @ts-nocheck

routerAdd(
  'POST',
  '/api/recommendations/request',
  (e) => {
    const payload = new DynamicModel({
      queryText: '',
      seasons: [],
      topK: 12,
    });
    e.bindBody(payload);

    const { requestOutfitRecommendation } = require(`${__hooks}/recommendation-service.ts`);
    const result = requestOutfitRecommendation(e.auth, payload.queryText, payload.topK, payload.seasons);
    if (!result.ok) {
      return e.error(result.statusCode, result.message, {});
    }

    return e.json(200, result.payload);
  },
  $apis.requireAuth(),
);

routerAdd(
  'POST',
  '/api/recommendations/reroll',
  (e) => {
    const payload = new DynamicModel({
      pinnedByCategory: {},
      pinnedItemIds: [],
      sessionId: '',
    });
    e.bindBody(payload);

    const { rerollOutfitRecommendation } = require(`${__hooks}/recommendation-service.ts`);
    const result = rerollOutfitRecommendation(e.auth, payload.sessionId, payload.pinnedItemIds, payload.pinnedByCategory);
    if (!result.ok) {
      return e.error(result.statusCode, result.message, {});
    }

    return e.json(200, result.payload);
  },
  $apis.requireAuth(),
);

routerAdd(
  'POST',
  '/api/recommendations/confirm',
  (e) => {
    const payload = new DynamicModel({
      note: '',
      selectedClothesIds: [],
      selectedItemIds: [],
      sessionId: '',
      wornDate: '',
    });
    e.bindBody(payload);

    const { confirmOutfitRecommendation } = require(`${__hooks}/recommendation-service.ts`);
    const result = confirmOutfitRecommendation(e.auth, payload);
    if (!result.ok) {
      return e.error(result.statusCode, result.message, {});
    }

    return e.json(200, result.payload);
  },
  $apis.requireAuth(),
);
