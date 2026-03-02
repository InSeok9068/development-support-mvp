// @ts-nocheck

const CLOTHES_COLLECTION = 'clothes';
const RECOMMENDATION_ITEMS_COLLECTION = 'recommendation_items';
const RECOMMENDATION_SESSIONS_COLLECTION = 'recommendation_sessions';
const WEAR_LOGS_COLLECTION = 'wear_logs';

const CATEGORY_VALUES = ['top', 'bottom', 'shoes', 'accessory'];
const SEASON_VALUES = ['spring', 'summer', 'fall', 'winter'];
const COLOR_VALUES = ['red', 'orange', 'yellow', 'green', 'blue', 'navy', 'purple', 'pink', 'white', 'gray', 'black', 'brown', 'beige'];
const STYLE_VALUES = ['street', 'casual', 'classic', 'minimal', 'sporty', 'feminine', 'vintage', 'workwear', 'formal', 'chic'];
const FIT_VALUES = ['oversized', 'slim', 'wide', 'loose', 'regular'];
const MATERIAL_VALUES = ['cotton', 'knit', 'leather', 'denim', 'wool', 'linen', 'polyester', 'nylon', 'silk'];
const CONTEXT_VALUES = ['daily', 'work', 'wedding', 'date', 'travel', 'exercise', 'party', 'formal_event'];
const DEFAULT_TOP_K = 12;
const SEASON_LABELS_KO = {
  fall: '가을',
  spring: '봄',
  summer: '여름',
  winter: '겨울',
};

const readAuthId = (authRecord) =>
  String(authRecord?.id ?? authRecord?.getString?.('id') ?? authRecord?.get?.('id') ?? '').trim();

const normalizeEnum = (value, allowed, fallback = '') => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  return allowed.includes(normalized) ? normalized : fallback;
};

const normalizeEnumArray = (values, allowed, maxSelect) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set();
  const normalized = [];

  values.forEach((value) => {
    if (normalized.length >= maxSelect) {
      return;
    }

    const item = normalizeEnum(value, allowed, '');
    if (!item || seen.has(item)) {
      return;
    }

    seen.add(item);
    normalized.push(item);
  });

  return normalized;
};

const normalizePinnedByCategory = (raw) => {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    top: String(source.top ?? '').trim(),
    bottom: String(source.bottom ?? '').trim(),
    shoes: String(source.shoes ?? '').trim(),
    accessory: String(source.accessory ?? '').trim(),
  };
};

const toNumberArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
};

const toRecordArray = (record, fieldName, allowed) => {
  const values = record.get(fieldName);
  return normalizeEnumArray(Array.isArray(values) ? values : [], allowed, 100);
};

const hasAny = (left, right) => {
  if (!right.length) {
    return true;
  }

  return right.some((value) => left.includes(value));
};

const cosineSimilarity = (left, right) => {
  const length = Math.min(left.length, right.length);
  if (!length) {
    return -1;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let i = 0; i < length; i += 1) {
    const l = Number(left[i]);
    const r = Number(right[i]);
    if (!Number.isFinite(l) || !Number.isFinite(r)) {
      continue;
    }
    dot += l * r;
    leftNorm += l * l;
    rightNorm += r * r;
  }

  if (!leftNorm || !rightNorm) {
    return -1;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
};

const findRecordById = (collectionName, recordId) => {
  try {
    return $app.findRecordById(collectionName, recordId);
  } catch {
    return null;
  }
};

const createSession = (args) => {
  const collection = $app.findCollectionByNameOrId(RECOMMENDATION_SESSIONS_COLLECTION);
  const record = new Record(collection);
  record.set('user', args.userId);
  record.set('queryText', args.queryText);
  record.set('queryFilter', args.queryFilter);
  record.set('queryEmbedding', args.queryEmbedding);
  record.set('topK', args.topK);
  record.set('state', args.state);
  record.set('errorCode', args.errorCode ?? '');
  record.set('errorMessage', args.errorMessage ?? '');
  $app.save(record);
  return record;
};

const createItem = (args) => {
  const collection = $app.findCollectionByNameOrId(RECOMMENDATION_ITEMS_COLLECTION);
  const record = new Record(collection);
  record.set('user', args.userId);
  record.set('session', args.sessionId);
  record.set('clothes', args.clothesId);
  record.set('category', args.category);
  record.set('rank', args.rank);
  record.set('similarity', args.similarity);
  record.set('round', args.round);
  record.set('isPinned', args.isPinned);
  record.set('isSelected', false);
  $app.save(record);
  return record;
};

const buildFallbackFilter = (queryText, seasonDefaults = []) => {
  const text = String(queryText ?? '').toLowerCase();
  const filter = {
    categories: [],
    colors: [],
    contexts: [],
    fit: '',
    materials: [],
    seasons: [],
    styles: [],
  };

  if (text.includes('상의') || text.includes('셔츠')) filter.categories.push('top');
  if (text.includes('하의') || text.includes('바지')) filter.categories.push('bottom');
  if (text.includes('신발') || text.includes('스니커')) filter.categories.push('shoes');
  if (text.includes('악세') || text.includes('모자') || text.includes('가방')) filter.categories.push('accessory');

  if (text.includes('봄')) filter.seasons.push('spring');
  if (text.includes('여름')) filter.seasons.push('summer');
  if (text.includes('가을')) filter.seasons.push('fall');
  if (text.includes('겨울')) filter.seasons.push('winter');

  if (text.includes('검정') || text.includes('블랙')) filter.colors.push('black');
  if (text.includes('화이트') || text.includes('흰')) filter.colors.push('white');
  if (text.includes('네이비')) filter.colors.push('navy');
  if (text.includes('베이지')) filter.colors.push('beige');

  if (text.includes('캐주얼')) filter.styles.push('casual');
  if (text.includes('미니멀')) filter.styles.push('minimal');
  if (text.includes('스트릿')) filter.styles.push('street');
  if (text.includes('클래식')) filter.styles.push('classic');

  if (text.includes('출근')) filter.contexts.push('work');
  if (text.includes('결혼식')) filter.contexts.push('wedding');
  if (text.includes('데이트')) filter.contexts.push('date');
  if (text.includes('여행')) filter.contexts.push('travel');
  if (text.includes('운동')) filter.contexts.push('exercise');

  const normalizedSeasonDefaults = normalizeEnumArray(seasonDefaults, SEASON_VALUES, 4);
  const normalizedSeasons = normalizeEnumArray(filter.seasons, SEASON_VALUES, 4);

  return {
    categories: normalizeEnumArray(filter.categories, CATEGORY_VALUES, 4),
    colors: normalizeEnumArray(filter.colors, COLOR_VALUES, 13),
    contexts: normalizeEnumArray(filter.contexts, CONTEXT_VALUES, 8),
    fit: normalizeEnum(filter.fit, FIT_VALUES, ''),
    materials: normalizeEnumArray(filter.materials, MATERIAL_VALUES, 9),
    seasons: normalizedSeasons.length ? normalizedSeasons : normalizedSeasonDefaults,
    styles: normalizeEnumArray(filter.styles, STYLE_VALUES, 10),
  };
};

const normalizeQueryFilter = (raw, fallback) => {
  const source = raw && typeof raw === 'object' ? raw : {};
  const fallbackFilter = fallback && typeof fallback === 'object' ? fallback : {};
  const category = normalizeEnum(source.category, CATEGORY_VALUES, '');
  const categories = normalizeEnumArray(source.categories, CATEGORY_VALUES, 4);
  if (category && !categories.includes(category)) {
    categories.push(category);
  }

  const fallbackCategories = normalizeEnumArray(fallbackFilter.categories, CATEGORY_VALUES, 4);
  const fallbackColors = normalizeEnumArray(fallbackFilter.colors, COLOR_VALUES, 13);
  const fallbackContexts = normalizeEnumArray(fallbackFilter.contexts, CONTEXT_VALUES, 8);
  const fallbackFit = normalizeEnum(fallbackFilter.fit, FIT_VALUES, '');
  const fallbackMaterials = normalizeEnumArray(fallbackFilter.materials, MATERIAL_VALUES, 9);
  const fallbackSeasons = normalizeEnumArray(fallbackFilter.seasons, SEASON_VALUES, 4);
  const fallbackStyles = normalizeEnumArray(fallbackFilter.styles, STYLE_VALUES, 10);

  const normalizedColors = normalizeEnumArray(source.colors, COLOR_VALUES, 13);
  const normalizedContexts = normalizeEnumArray(source.contexts, CONTEXT_VALUES, 8);
  const normalizedFit = normalizeEnum(source.fit, FIT_VALUES, '');
  const normalizedMaterials = normalizeEnumArray(source.materials, MATERIAL_VALUES, 9);
  const normalizedSeasons = normalizeEnumArray(source.seasons, SEASON_VALUES, 4);
  const normalizedStyles = normalizeEnumArray(source.styles, STYLE_VALUES, 10);

  return {
    categories: categories.length ? categories : fallbackCategories,
    colors: normalizedColors.length ? normalizedColors : fallbackColors,
    contexts: normalizedContexts.length ? normalizedContexts : fallbackContexts,
    fit: normalizedFit || fallbackFit,
    materials: normalizedMaterials.length ? normalizedMaterials : fallbackMaterials,
    seasons: normalizedSeasons.length ? normalizedSeasons : fallbackSeasons,
    styles: normalizedStyles.length ? normalizedStyles : fallbackStyles,
  };
};

const runQueryFilterStep = (queryText, seasonDefaults = []) => {
  const normalizedSeasonDefaults = normalizeEnumArray(seasonDefaults, SEASON_VALUES, 4);
  const fallbackFilter = buildFallbackFilter(queryText, normalizedSeasonDefaults);
  const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.GEMINI_AI_KEY;
  const utils = require(`${__hooks}/clothes-pipeline-utils.ts`);

  if (!geminiApiKey) {
    return {
      filter: fallbackFilter,
      model: 'fallback-query-filter-v1',
    };
  }

  const prompt =
    '자연어 옷 추천 요청을 필터 JSON으로 변환해. 코드펜스 없이 JSON만 반환.\n' +
    'keys: categories,seasons,colors,styles,fit,materials,contexts\n' +
    `defaultSeasons: ${JSON.stringify(normalizedSeasonDefaults)}\n` +
    `queryText: ${queryText}`;

  const response = $http.send({
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 },
    }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
    timeout: 30,
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
  });

  const responseBody = toString(response.body);
  if (response.statusCode < 200 || response.statusCode >= 300) {
    return {
      filter: fallbackFilter,
      model: 'fallback-query-filter-v1',
    };
  }

  const payload = utils.parseJsonSafely(responseBody, {});
  const generatedText = payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const normalizedJsonText = utils.extractJsonObjectText(generatedText);
  const parsed = utils.parseJsonSafely(normalizedJsonText, null);

  return {
    filter: normalizeQueryFilter(parsed, fallbackFilter),
    model: 'gemini-2.5-flash-lite',
  };
};

const runQueryEmbeddingStep = (queryText) => {
  const utils = require(`${__hooks}/clothes-pipeline-utils.ts`);
  const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.GEMINI_AI_KEY;

  if (!geminiApiKey) {
    return {
      embedding: utils.buildDeterministicEmbedding(queryText, 32),
      model: 'fallback-embedding-v1',
    };
  }

  const model = 'gemini-embedding-001';
  const response = $http.send({
    body: JSON.stringify({
      model: `models/${model}`,
      content: { parts: [{ text: queryText }] },
    }),
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': geminiApiKey,
    },
    method: 'POST',
    timeout: 30,
    url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`,
  });

  const responseBody = toString(response.body);
  if (response.statusCode < 200 || response.statusCode >= 300) {
    return {
      embedding: utils.buildDeterministicEmbedding(queryText, 32),
      model: 'fallback-embedding-v1',
    };
  }

  const payload = utils.parseJsonSafely(responseBody, {});
  const embedding = toNumberArray(payload?.embedding?.values);
  if (!embedding.length) {
    return {
      embedding: utils.buildDeterministicEmbedding(queryText, 32),
      model: 'fallback-embedding-v1',
    };
  }

  return {
    embedding,
    model,
  };
};

const matchFilter = (record, filter) => {
  const category = normalizeEnum(record.get('category'), CATEGORY_VALUES, '');
  if (filter.categories.length && !filter.categories.includes(category)) {
    return false;
  }

  const fit = normalizeEnum(record.get('fit'), FIT_VALUES, '');
  if (filter.fit && fit !== filter.fit) {
    return false;
  }

  if (!hasAny(toRecordArray(record, 'seasons', SEASON_VALUES), filter.seasons)) return false;
  if (!hasAny(toRecordArray(record, 'colors', COLOR_VALUES), filter.colors)) return false;
  if (!hasAny(toRecordArray(record, 'styles', STYLE_VALUES), filter.styles)) return false;
  if (!hasAny(toRecordArray(record, 'materials', MATERIAL_VALUES), filter.materials)) return false;
  if (!hasAny(toRecordArray(record, 'contexts', CONTEXT_VALUES), filter.contexts)) return false;

  return true;
};

const buildCandidates = (records, filter, queryEmbedding, topK) => {
  const scored = [];
  records.forEach((record) => {
    if (!record || !matchFilter(record, filter)) {
      return;
    }

    const category = normalizeEnum(record.get('category'), CATEGORY_VALUES, '');
    if (!category) {
      return;
    }

    const embedding = toNumberArray(record.get('embedding'));
    const similarity = queryEmbedding.length && embedding.length ? cosineSimilarity(queryEmbedding, embedding) : -1;
    const preferenceScore = Number(record.get('preferenceScore') ?? 0);
    const score = similarity + (Number.isFinite(preferenceScore) ? preferenceScore : 0) * 0.02;

    scored.push({
      category,
      clothesId: record.id,
      record,
      similarity: Number(similarity.toFixed(6)),
      score,
    });
  });

  scored.sort((a, b) => b.score - a.score);

  const byCategory = {
    accessory: [],
    bottom: [],
    shoes: [],
    top: [],
  };
  scored.forEach((candidate) => {
    const bucket = byCategory[candidate.category];
    if (bucket.length < topK) {
      bucket.push(candidate);
    }
  });

  return byCategory;
};

const serializeClothes = (record) => ({
  category: normalizeEnum(record.get('category'), CATEGORY_VALUES, ''),
  colors: toRecordArray(record, 'colors', COLOR_VALUES),
  contexts: toRecordArray(record, 'contexts', CONTEXT_VALUES),
  fit: normalizeEnum(record.get('fit'), FIT_VALUES, ''),
  id: record.id,
  imageHash: String(record.get('imageHash') ?? ''),
  materials: toRecordArray(record, 'materials', MATERIAL_VALUES),
  preferenceScore: Number(record.get('preferenceScore') ?? 0),
  seasons: toRecordArray(record, 'seasons', SEASON_VALUES),
  sourceImage: String(record.get('sourceImage') ?? ''),
  sourceUrl: String(record.get('sourceUrl') ?? ''),
  styles: toRecordArray(record, 'styles', STYLE_VALUES),
});

const serializeItem = (itemRecord, clothesRecord) => ({
  category: String(itemRecord.get('category') ?? ''),
  clothes: clothesRecord ? serializeClothes(clothesRecord) : null,
  isPinned: Boolean(itemRecord.get('isPinned')),
  itemId: itemRecord.id,
  rank: Number(itemRecord.get('rank') ?? 0),
  round: Number(itemRecord.get('round') ?? 1),
  similarity: Number(itemRecord.get('similarity') ?? 0),
});

const buildWeatherBasedDefaultQueryText = (seasonDefaults = []) => {
  const normalizedSeasons = normalizeEnumArray(seasonDefaults, SEASON_VALUES, 4);
  if (!normalizedSeasons.length) {
    return '오늘 날씨에 맞는 데일리 코디 추천';
  }

  const seasonLabels = normalizedSeasons.map((season) => SEASON_LABELS_KO[season] ?? season).join('/');
  return `오늘 ${seasonLabels} 날씨에 맞는 데일리 코디 추천`;
};

const requestOutfitRecommendation = (authRecord, queryText, topKInput, seasonsInput = []) => {
  const userId = readAuthId(authRecord);
  if (!userId) return { ok: false, statusCode: 401, message: '인증 정보가 필요합니다.' };

  const topK = Math.max(1, Math.min(50, Math.trunc(Number(topKInput) || DEFAULT_TOP_K)));
  const normalizedSeasonDefaults = normalizeEnumArray(Array.isArray(seasonsInput) ? seasonsInput : [], SEASON_VALUES, 4);
  const normalizedQueryText = String(queryText ?? '').trim();
  const effectiveQueryText = normalizedQueryText || buildWeatherBasedDefaultQueryText(normalizedSeasonDefaults);
  const filterResult = runQueryFilterStep(effectiveQueryText, normalizedSeasonDefaults);
  const embeddingResult = runQueryEmbeddingStep(effectiveQueryText);

  const doneRecords = $app.findRecordsByFilter(
    CLOTHES_COLLECTION,
    'user = {:userId} && state = "done"',
    '-preferenceScore,-updated',
    0,
    0,
    { userId },
  );

  const candidates = buildCandidates(doneRecords, filterResult.filter, embeddingResult.embedding, topK);
  const baseCategories = filterResult.filter.categories.length ? filterResult.filter.categories : CATEGORY_VALUES;
  const targetCategories = baseCategories.filter((category) => candidates[category]?.length);

  if (!targetCategories.length) {
    createSession({
      userId,
      queryText: effectiveQueryText,
      queryFilter: filterResult.filter,
      queryEmbedding: embeddingResult.embedding,
      topK,
      state: 'failed',
      errorCode: 'no_candidates',
      errorMessage: '조건에 맞는 추천 후보가 없습니다.',
    });
    return { ok: false, statusCode: 400, message: '조건에 맞는 추천 후보가 없습니다.' };
  }

  const sessionRecord = createSession({
    userId,
    queryText: effectiveQueryText,
    queryFilter: filterResult.filter,
    queryEmbedding: embeddingResult.embedding,
    topK,
    state: 'done',
  });

  const createdItems = [];
  targetCategories.forEach((category) => {
    const selected = candidates[category][0];
    const item = createItem({
      userId,
      sessionId: sessionRecord.id,
      clothesId: selected.clothesId,
      category,
      rank: 1,
      similarity: selected.similarity,
      round: 1,
      isPinned: false,
    });
    createdItems.push(serializeItem(item, selected.record));
  });

  return {
    ok: true,
    payload: {
      embeddingModel: embeddingResult.model,
      filterModel: filterResult.model,
      items: createdItems,
      queryFilter: filterResult.filter,
      round: 1,
      sessionId: sessionRecord.id,
      topK,
    },
  };
};

const rerollOutfitRecommendation = (authRecord, sessionId, pinnedItemIds, pinnedByCategoryInput) => {
  const userId = readAuthId(authRecord);
  if (!userId) return { ok: false, statusCode: 401, message: '인증 정보가 필요합니다.' };

  const normalizedSessionId = String(sessionId ?? '').trim();
  const sessionRecord = findRecordById(RECOMMENDATION_SESSIONS_COLLECTION, normalizedSessionId);
  if (!sessionRecord) return { ok: false, statusCode: 404, message: '추천 세션을 찾지 못했습니다.' };
  if (String(sessionRecord.get('user') ?? '') !== userId) return { ok: false, statusCode: 403, message: '권한이 없습니다.' };

  const allItems = $app.findRecordsByFilter(RECOMMENDATION_ITEMS_COLLECTION, 'session = {:sessionId}', 'round,created', 0, 0, { sessionId: normalizedSessionId });
  const maxRound = allItems.reduce((acc, item) => Math.max(acc, Number(item.get('round') ?? 1)), 1);
  const currentRoundItems = allItems.filter((item) => Number(item.get('round') ?? 1) === maxRound);
  const pinnedSet = new Set((Array.isArray(pinnedItemIds) ? pinnedItemIds : []).map((id) => String(id ?? '').trim()).filter(Boolean));
  const normalizedPinnedByCategory = normalizePinnedByCategory(pinnedByCategoryInput);

  const pinnedByCategory = {};
  const usedByCategory = { accessory: new Set(), bottom: new Set(), shoes: new Set(), top: new Set() };
  allItems.forEach((item) => {
    const category = normalizeEnum(item.get('category'), CATEGORY_VALUES, '');
    const clothesId = String(item.get('clothes') ?? '').trim();
    if (category && clothesId) usedByCategory[category].add(clothesId);
  });

  currentRoundItems.forEach((item) => {
    const category = normalizeEnum(item.get('category'), CATEGORY_VALUES, '');
    const clothesId = String(item.get('clothes') ?? '').trim();
    const isPinnedByItem = pinnedSet.has(item.id);
    const isPinnedByCategory = Boolean(category && clothesId && normalizedPinnedByCategory[category] === clothesId);
    const isPinned = isPinnedByItem || isPinnedByCategory;
    item.set('isPinned', isPinned);
    $app.save(item);
    if (isPinned && category && clothesId) pinnedByCategory[category] = clothesId;
  });

  CATEGORY_VALUES.forEach((category) => {
    const pinnedClothesId = String(normalizedPinnedByCategory[category] ?? '').trim();
    if (!pinnedClothesId || pinnedByCategory[category]) {
      return;
    }

    pinnedByCategory[category] = pinnedClothesId;
  });

  const queryFilter = normalizeQueryFilter(sessionRecord.get('queryFilter'));
  let queryEmbedding = toNumberArray(sessionRecord.get('queryEmbedding'));
  if (!queryEmbedding.length) {
    queryEmbedding = runQueryEmbeddingStep(String(sessionRecord.get('queryText') ?? '')).embedding;
    sessionRecord.set('queryEmbedding', queryEmbedding);
    $app.save(sessionRecord);
  }

  const topK = Math.max(1, Math.min(50, Math.trunc(Number(sessionRecord.get('topK') ?? DEFAULT_TOP_K))));
  const doneRecords = $app.findRecordsByFilter(CLOTHES_COLLECTION, 'user = {:userId} && state = "done"', '-preferenceScore,-updated', 0, 0, { userId });
  const candidates = buildCandidates(doneRecords, queryFilter, queryEmbedding, topK);
  const categories = currentRoundItems.map((item) => normalizeEnum(item.get('category'), CATEGORY_VALUES, '')).filter(Boolean);
  const targetCategories = categories.length ? categories : CATEGORY_VALUES;

  const nextRound = maxRound + 1;
  const nextItems = [];
  targetCategories.forEach((category) => {
    const pool = candidates[category] ?? [];
    let selected = null;
    let isPinned = false;

    if (pinnedByCategory[category]) {
      isPinned = true;
      selected = pool.find((candidate) => candidate.clothesId === pinnedByCategory[category]) ?? null;
      if (!selected) {
        const clothesRecord = findRecordById(CLOTHES_COLLECTION, pinnedByCategory[category]);
        const clothesCategory = normalizeEnum(clothesRecord?.get('category'), CATEGORY_VALUES, '');
        if (clothesRecord && String(clothesRecord.get('user') ?? '') === userId && clothesCategory === category) {
          selected = { clothesId: clothesRecord.id, record: clothesRecord, similarity: 0 };
        }
      }
    } else {
      selected = pool.find((candidate) => !usedByCategory[category].has(candidate.clothesId)) ?? pool[0] ?? null;
    }

    if (!selected) return;

    const rankIndex = pool.findIndex((candidate) => candidate.clothesId === selected.clothesId);
    const item = createItem({
      userId,
      sessionId: normalizedSessionId,
      clothesId: selected.clothesId,
      category,
      rank: rankIndex >= 0 ? rankIndex + 1 : 1,
      similarity: Number(selected.similarity ?? 0),
      round: nextRound,
      isPinned,
    });
    nextItems.push(serializeItem(item, selected.record));
  });

  if (!nextItems.length) {
    return { ok: false, statusCode: 400, message: '재추천할 후보가 없습니다.' };
  }

  return {
    ok: true,
    payload: {
      items: nextItems,
      round: nextRound,
      sessionId: normalizedSessionId,
    },
  };
};

const toDateOnly = (value) => {
  const normalized = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const confirmOutfitRecommendation = (authRecord, args) => {
  const userId = readAuthId(authRecord);
  if (!userId) return { ok: false, statusCode: 401, message: '인증 정보가 필요합니다.' };

  const sessionId = String(args?.sessionId ?? '').trim();
  const sessionRecord = findRecordById(RECOMMENDATION_SESSIONS_COLLECTION, sessionId);
  if (!sessionRecord) return { ok: false, statusCode: 404, message: '추천 세션을 찾지 못했습니다.' };
  if (String(sessionRecord.get('user') ?? '') !== userId) return { ok: false, statusCode: 403, message: '권한이 없습니다.' };

  const allItems = $app.findRecordsByFilter(RECOMMENDATION_ITEMS_COLLECTION, 'session = {:sessionId}', 'round,created', 0, 0, { sessionId });
  const maxRound = allItems.reduce((acc, item) => Math.max(acc, Number(item.get('round') ?? 1)), 1);
  const currentRoundItems = allItems.filter((item) => Number(item.get('round') ?? 1) === maxRound);
  const selectedIdSet = new Set((Array.isArray(args?.selectedItemIds) ? args.selectedItemIds : []).map((id) => String(id ?? '').trim()).filter(Boolean));
  const selectedClothesIdSet = new Set((Array.isArray(args?.selectedClothesIds) ? args.selectedClothesIds : []).map((id) => String(id ?? '').trim()).filter(Boolean));
  const selectedItems = selectedIdSet.size ? currentRoundItems.filter((item) => selectedIdSet.has(item.id)) : currentRoundItems;

  if (!selectedClothesIdSet.size) {
    selectedItems.forEach((item) => {
      const clothesId = String(item.get('clothes') ?? '').trim();
      if (clothesId) {
        selectedClothesIdSet.add(clothesId);
      }
    });
  }

  if (!selectedClothesIdSet.size) return { ok: false, statusCode: 400, message: '선택된 옷이 없습니다.' };

  const selectedClothesRecords = [];
  selectedClothesIdSet.forEach((id) => {
    const clothesRecord = findRecordById(CLOTHES_COLLECTION, id);
    if (!clothesRecord) return;
    if (String(clothesRecord.get('user') ?? '') !== userId) return;
    selectedClothesRecords.push(clothesRecord);
  });
  if (!selectedClothesRecords.length) return { ok: false, statusCode: 400, message: '선택된 옷이 없습니다.' };

  const selectedClothesIds = selectedClothesRecords.map((record) => record.id);
  const selectedClothesIdLookup = new Set(selectedClothesIds);
  currentRoundItems.forEach((item) => {
    const clothesId = String(item.get('clothes') ?? '').trim();
    const isSelected = selectedIdSet.has(item.id) || selectedClothesIdLookup.has(clothesId);
    if (!isSelected) {
      return;
    }

    item.set('isSelected', true);
    $app.save(item);
  });

  const wornDate = toDateOnly(args?.wornDate);
  const note = String(args?.note ?? '').trim();
  const wearLogsCollection = $app.findCollectionByNameOrId(WEAR_LOGS_COLLECTION);
  const wearLogRecord = new Record(wearLogsCollection);
  wearLogRecord.set('user', userId);
  wearLogRecord.set('session', sessionId);
  wearLogRecord.set('items', selectedClothesIds);
  wearLogRecord.set('wornDate', wornDate);
  wearLogRecord.set('note', note);
  $app.save(wearLogRecord);

  selectedClothesRecords.forEach((clothesRecord) => {
    const score = Number(clothesRecord.get('preferenceScore') ?? 0);
    clothesRecord.set('preferenceScore', Number.isFinite(score) ? score + 1 : 1);
    clothesRecord.set('lastWornAt', wornDate);
    $app.save(clothesRecord);
  });

  return {
    ok: true,
    payload: {
      selectedCount: selectedClothesIds.length,
      sessionId,
      wearLogId: wearLogRecord.id,
      wornDate,
    },
  };
};

module.exports = {
  confirmOutfitRecommendation,
  requestOutfitRecommendation,
  rerollOutfitRecommendation,
};
