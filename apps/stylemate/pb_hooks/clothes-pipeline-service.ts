// @ts-nocheck

const COLLECTION_NAME = 'clothes';

const readAuthId = (authRecord) =>
  String(authRecord?.id ?? authRecord?.getString?.('id') ?? authRecord?.get?.('id') ?? '').trim();

const findClothesRecordById = (clothesId) => {
  try {
    return $app.findRecordById(COLLECTION_NAME, clothesId);
  } catch {
    return null;
  }
};

const saveClothesRecord = (record, fields) => {
  Object.keys(fields).forEach((fieldName) => {
    record.set(fieldName, fields[fieldName]);
  });
  $app.save(record);
  return record;
};

const updateClothesById = (clothesId, fields) => {
  const record = findClothesRecordById(clothesId);
  if (!record) {
    return null;
  }

  return saveClothesRecord(record, fields);
};

const failClothesById = (clothesId, errorCode, errorMessage) => {
  return updateClothesById(clothesId, {
    errorCode,
    errorMessage,
    state: 'failed',
  });
};

const normalizeRetryLimit = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.trunc(parsed));
};

const runPreprocessStep = (record) => {
  const sourceType = String(record.get('sourceType') ?? '').trim();
  const sourceImage = String(record.get('sourceImage') ?? '').trim();
  const sourceUrl = String(record.get('sourceUrl') ?? '').trim();

  if ('upload' === sourceType && !sourceImage) {
    return {
      ok: false,
      errorCode: 'image_decode_error',
      errorMessage: '이미지 파일을 찾지 못했습니다.',
    };
  }

  if ('url' === sourceType && !sourceUrl) {
    return {
      ok: false,
      errorCode: 'image_decode_error',
      errorMessage: '이미지 URL이 비어 있습니다.',
    };
  }

  const imageHashBase = sourceUrl || sourceImage || `${record.id}:${record.get('created')}`;
  const imageHash = $security.md5(imageHashBase);
  const fields = {
    imageHash,
  };

  return {
    ok: true,
    fields,
  };
};

const runAnalyzeStep = (record) => {
  const logger = $app.logger().with('hook', 'stylemate-clothes-analyze');
  const utils = require(`${__hooks}/clothes-pipeline-utils.ts`);

  const sourceUrl = String(record.get('sourceUrl') ?? '').trim();
  const sourceImage = String(record.get('sourceImage') ?? '').trim();
  const imageHash = String(record.get('imageHash') ?? '').trim();
  const sourceText = sourceUrl || sourceImage || imageHash;
  const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.GEMINI_AI_KEY;

  if (!geminiApiKey) {
    const fallbackAnalysis = utils.buildFallbackAnalysis(sourceText);
    return {
      ok: true,
      analysis: fallbackAnalysis,
    };
  }

  const prompt =
    '아래 의류 정보를 바탕으로 카테고리/계절/색상/스타일/핏/소재/상황을 JSON 객체로 반환해.\n' +
    '코드펜스 없이 JSON만 반환.\n' +
    'enum 값은 반드시 아래 값만 사용.\n' +
    '\n' +
    'category: top, bottom, shoes, accessory\n' +
    'seasons: spring, summer, fall, winter\n' +
    'colors: red, orange, yellow, green, blue, navy, purple, pink, white, gray, black, brown, beige\n' +
    'styles: street, casual, classic, minimal, sporty, feminine, vintage, workwear, formal, chic\n' +
    'fit: oversized, slim, wide, loose, regular\n' +
    'materials: cotton, knit, leather, denim, wool, linen, polyester, nylon, silk\n' +
    'contexts: daily, work, wedding, date, travel, exercise, party, formal_event\n' +
    '\n' +
    '응답 스키마:\n' +
    '{\n' +
    '  "category": "top",\n' +
    '  "seasons": ["spring"],\n' +
    '  "colors": ["black"],\n' +
    '  "styles": ["casual"],\n' +
    '  "fit": "regular",\n' +
    '  "materials": ["cotton"],\n' +
    '  "contexts": ["daily"]\n' +
    '}\n' +
    '\n' +
    `sourceText: ${sourceText}\n`;

  const response = $http.send({
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
      },
    }),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
    timeout: 45,
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
  });

  const responseBody = toString(response.body);
  const isSuccess = response.statusCode >= 200 && response.statusCode < 300;
  if (!isSuccess) {
    logger.error('gemini analyze failed', 'statusCode', response.statusCode, 'body', responseBody);
    return {
      ok: false,
      errorCode: 'ai_timeout',
      errorMessage: `AI 분석 요청 실패 (HTTP ${response.statusCode})`,
    };
  }

  const payload = utils.parseJsonSafely(responseBody, {});
  const generatedText = payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const normalizedJsonText = utils.extractJsonObjectText(generatedText);
  const parsedAnalysis = utils.parseJsonSafely(normalizedJsonText, null);
  if (!parsedAnalysis || typeof parsedAnalysis !== 'object') {
    return {
      ok: false,
      errorCode: 'ai_invalid_json',
      errorMessage: 'AI 응답 JSON 파싱에 실패했습니다.',
    };
  }

  return {
    ok: true,
    analysis: utils.normalizeAnalysis(parsedAnalysis),
  };
};

const runEmbeddingStep = (record) => {
  const logger = $app.logger().with('hook', 'stylemate-clothes-embedding');
  const utils = require(`${__hooks}/clothes-pipeline-utils.ts`);
  const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.GEMINI_AI_KEY;
  const embeddingText = JSON.stringify({
    category: record.get('category'),
    colors: record.get('colors'),
    contexts: record.get('contexts'),
    fit: record.get('fit'),
    imageHash: record.get('imageHash'),
    materials: record.get('materials'),
    seasons: record.get('seasons'),
    styles: record.get('styles'),
  });

  if (!geminiApiKey) {
    return {
      ok: true,
      embedding: utils.buildDeterministicEmbedding(embeddingText),
      embeddingModel: 'fallback-embedding-v1',
    };
  }

  const embeddingModel = 'gemini-embedding-001';
  const response = $http.send({
    body: JSON.stringify({
      model: `models/${embeddingModel}`,
      content: {
        parts: [{ text: embeddingText }],
      },
    }),
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': geminiApiKey,
    },
    method: 'POST',
    timeout: 45,
    url: `https://generativelanguage.googleapis.com/v1beta/models/${embeddingModel}:embedContent`,
  });

  const responseBody = toString(response.body);
  const isSuccess = response.statusCode >= 200 && response.statusCode < 300;
  if (!isSuccess) {
    logger.error('gemini embedding failed', 'statusCode', response.statusCode, 'body', responseBody);
    return {
      ok: false,
      errorCode: 'embedding_error',
      errorMessage: `임베딩 생성 요청 실패 (HTTP ${response.statusCode})`,
    };
  }

  const payload = utils.parseJsonSafely(responseBody, {});
  const embeddingValues = Array.isArray(payload?.embedding?.values) ? payload.embedding.values : null;
  if (!embeddingValues || !embeddingValues.length) {
    return {
      ok: false,
      errorCode: 'embedding_error',
      errorMessage: '임베딩 벡터가 비어 있습니다.',
    };
  }

  return {
    ok: true,
    embedding: embeddingValues,
    embeddingModel,
  };
};

const processClothesPipeline = (clothesId) => {
  const logger = $app.logger().with('hook', 'stylemate-clothes-pipeline', 'clothesId', clothesId);
  const currentRecord = findClothesRecordById(clothesId);

  if (!currentRecord) {
    return;
  }

  if ('uploaded' !== String(currentRecord.get('state') ?? '')) {
    return;
  }

  const retryCount = normalizeRetryLimit(currentRecord.get('retryCount'), 0);
  const maxRetry = normalizeRetryLimit(currentRecord.get('maxRetry'), 3);
  if (maxRetry > 0 && retryCount > maxRetry) {
    failClothesById(clothesId, 'embedding_error', '최대 재시도 횟수를 초과했습니다.');
    return;
  }

  logger.info('pipeline started');
  updateClothesById(clothesId, {
    errorCode: null,
    errorMessage: '',
    state: 'preprocessing',
  });

  let stepRecord = findClothesRecordById(clothesId);
  if (!stepRecord) {
    return;
  }

  const preprocessResult = runPreprocessStep(stepRecord);
  if (!preprocessResult.ok) {
    failClothesById(clothesId, preprocessResult.errorCode, preprocessResult.errorMessage);
    return;
  }

  updateClothesById(clothesId, preprocessResult.fields);
  updateClothesById(clothesId, { state: 'analyzing' });

  stepRecord = findClothesRecordById(clothesId);
  if (!stepRecord) {
    return;
  }

  const analyzeResult = runAnalyzeStep(stepRecord);
  if (!analyzeResult.ok) {
    failClothesById(clothesId, analyzeResult.errorCode, analyzeResult.errorMessage);
    return;
  }

  updateClothesById(clothesId, {
    category: analyzeResult.analysis.category,
    colors: analyzeResult.analysis.colors,
    contexts: analyzeResult.analysis.contexts,
    fit: analyzeResult.analysis.fit,
    materials: analyzeResult.analysis.materials,
    seasons: analyzeResult.analysis.seasons,
    styles: analyzeResult.analysis.styles,
  });

  updateClothesById(clothesId, { state: 'embedding' });

  stepRecord = findClothesRecordById(clothesId);
  if (!stepRecord) {
    return;
  }

  const embeddingResult = runEmbeddingStep(stepRecord);
  if (!embeddingResult.ok) {
    failClothesById(clothesId, embeddingResult.errorCode, embeddingResult.errorMessage);
    return;
  }

  updateClothesById(clothesId, {
    embedding: embeddingResult.embedding,
    embeddingModel: embeddingResult.embeddingModel,
    errorCode: null,
    errorMessage: '',
    state: 'done',
  });
  logger.info('pipeline completed');
};

const createClothesByUrl = (authRecord, sourceUrl) => {
  const authId = readAuthId(authRecord);
  if (!authId) {
    return {
      ok: false,
      statusCode: 401,
      message: '인증 정보가 필요합니다.',
    };
  }

  const normalizedUrl = String(sourceUrl ?? '').trim();
  if (!normalizedUrl || !/^https?:\/\//i.test(normalizedUrl)) {
    return {
      ok: false,
      statusCode: 400,
      message: '유효한 이미지 URL을 입력해주세요.',
    };
  }

  const collection = $app.findCollectionByNameOrId(COLLECTION_NAME);
  const record = new Record(collection);
  record.set('maxRetry', 3);
  record.set('retryCount', 0);
  record.set('sourceType', 'url');
  record.set('sourceUrl', normalizedUrl);
  record.set('state', 'uploaded');
  record.set('user', authId);
  $app.save(record);

  return {
    ok: true,
    record,
  };
};

const retryClothesById = (authRecord, clothesId) => {
  const authId = readAuthId(authRecord);
  if (!authId) {
    return {
      ok: false,
      statusCode: 401,
      message: '인증 정보가 필요합니다.',
    };
  }

  const record = findClothesRecordById(clothesId);
  if (!record) {
    return {
      ok: false,
      statusCode: 404,
      message: '옷 아이템을 찾지 못했습니다.',
    };
  }

  if (String(record.get('user') ?? '') !== authId) {
    return {
      ok: false,
      statusCode: 403,
      message: '본인 데이터만 재시도할 수 있습니다.',
    };
  }

  const retryCount = normalizeRetryLimit(record.get('retryCount'), 0);
  const maxRetry = normalizeRetryLimit(record.get('maxRetry'), 3);

  if (maxRetry > 0 && retryCount >= maxRetry) {
    saveClothesRecord(record, {
      errorMessage: '최대 재시도 횟수를 초과했습니다.',
      state: 'failed',
    });

    return {
      ok: false,
      statusCode: 400,
      message: '최대 재시도 횟수를 초과했습니다.',
    };
  }

  saveClothesRecord(record, {
    errorCode: null,
    errorMessage: '',
    retryCount: retryCount + 1,
    state: 'uploaded',
  });

  return {
    ok: true,
    record,
  };
};

const reembedClothesById = (authRecord, clothesId) => {
  const authId = readAuthId(authRecord);
  if (!authId) {
    return {
      ok: false,
      statusCode: 401,
      message: '인증 정보가 필요합니다.',
    };
  }

  const record = findClothesRecordById(clothesId);
  if (!record) {
    return {
      ok: false,
      statusCode: 404,
      message: '옷 아이템을 찾지 못했습니다.',
    };
  }

  if (String(record.get('user') ?? '') !== authId) {
    return {
      ok: false,
      statusCode: 403,
      message: '본인 데이터만 재임베딩할 수 있습니다.',
    };
  }

  saveClothesRecord(record, {
    errorCode: null,
    errorMessage: '',
    state: 'embedding',
  });

  const preprocessResult = runPreprocessStep(record);
  if (!preprocessResult.ok) {
    failClothesById(clothesId, preprocessResult.errorCode, preprocessResult.errorMessage);
    return {
      ok: false,
      statusCode: 400,
      message: preprocessResult.errorMessage,
    };
  }

  saveClothesRecord(record, preprocessResult.fields);

  const refreshedRecord = findClothesRecordById(clothesId);
  if (!refreshedRecord) {
    return {
      ok: false,
      statusCode: 404,
      message: '옷 아이템을 찾지 못했습니다.',
    };
  }

  const embeddingResult = runEmbeddingStep(refreshedRecord);
  if (!embeddingResult.ok) {
    failClothesById(clothesId, embeddingResult.errorCode, embeddingResult.errorMessage);
    return {
      ok: false,
      statusCode: 502,
      message: embeddingResult.errorMessage,
    };
  }

  saveClothesRecord(refreshedRecord, {
    embedding: embeddingResult.embedding,
    embeddingModel: embeddingResult.embeddingModel,
    errorCode: null,
    errorMessage: '',
    state: 'done',
  });

  return {
    ok: true,
    record: refreshedRecord,
  };
};

module.exports = {
  createClothesByUrl,
  processClothesPipeline,
  reembedClothesById,
  retryClothesById,
};
