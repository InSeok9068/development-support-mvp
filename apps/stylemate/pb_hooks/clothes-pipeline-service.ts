// @ts-nocheck

const COLLECTION_NAME = 'clothes';
const RECOMMENDATION_ITEMS_COLLECTION = 'recommendation_items';
const WEAR_LOGS_COLLECTION = 'wear_logs';
const ANALYZE_MODEL = 'gemini-2.5-flash-lite';
const MAX_ANALYZE_IMAGE_BYTES = 10 * 1024 * 1024;

const IMAGE_MIME_BY_EXTENSION = {
  '.bmp': 'image/bmp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

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

const readHeaderValue = (headers, targetName) => {
  const headerMap = headers && typeof headers === 'object' ? headers : {};
  const normalizedTarget = String(targetName ?? '').toLowerCase();
  const headerNames = Object.keys(headerMap);

  for (let index = 0; index < headerNames.length; index += 1) {
    const headerName = headerNames[index];
    if (String(headerName).toLowerCase() !== normalizedTarget) {
      continue;
    }

    const rawValue = headerMap[headerName];
    if (Array.isArray(rawValue)) {
      return String(rawValue[0] ?? '').trim();
    }
    return String(rawValue ?? '').trim();
  }

  return '';
};

const hasBytePrefix = (bytes, prefix, offset = 0) => {
  if (!Array.isArray(bytes) || bytes.length < offset + prefix.length) {
    return false;
  }

  for (let index = 0; index < prefix.length; index += 1) {
    if (Number(bytes[offset + index]) !== Number(prefix[index])) {
      return false;
    }
  }

  return true;
};

const normalizeImageMimeType = (value) => {
  const rawMimeType = String(value ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  if (!rawMimeType) {
    return '';
  }

  if ('image/jpg' === rawMimeType || 'image/pjpeg' === rawMimeType) {
    return 'image/jpeg';
  }

  if ('image/x-png' === rawMimeType) {
    return 'image/png';
  }

  return rawMimeType;
};

const detectImageMimeTypeByExtension = (sourceName) => {
  const extension = String($filepath.ext(String(sourceName ?? '')) ?? '')
    .trim()
    .toLowerCase();

  return IMAGE_MIME_BY_EXTENSION[extension] ?? '';
};

const detectImageMimeTypeBySignature = (bytes) => {
  if (hasBytePrefix(bytes, [0xff, 0xd8, 0xff])) {
    return 'image/jpeg';
  }

  if (hasBytePrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }

  if (hasBytePrefix(bytes, [0x47, 0x49, 0x46, 0x38])) {
    return 'image/gif';
  }

  if (hasBytePrefix(bytes, [0x52, 0x49, 0x46, 0x46]) && hasBytePrefix(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp';
  }

  if (hasBytePrefix(bytes, [0x42, 0x4d])) {
    return 'image/bmp';
  }

  if (hasBytePrefix(bytes, [0x66, 0x74, 0x79, 0x70], 4)) {
    const majorBrand = String.fromCharCode(
      Number(bytes[8] ?? 0),
      Number(bytes[9] ?? 0),
      Number(bytes[10] ?? 0),
      Number(bytes[11] ?? 0),
    ).toLowerCase();

    if (['heic', 'heix', 'hevc', 'hevx'].includes(majorBrand)) {
      return 'image/heic';
    }

    if (['heif', 'heim', 'heis', 'mif1', 'msf1'].includes(majorBrand)) {
      return 'image/heif';
    }
  }

  return '';
};

const resolveImageMimeType = (bytes, headerMimeType, sourceName) => {
  const signatureMimeType = detectImageMimeTypeBySignature(bytes);
  if (signatureMimeType) {
    return signatureMimeType;
  }

  const normalizedHeaderMimeType = normalizeImageMimeType(headerMimeType);
  if (normalizedHeaderMimeType && normalizedHeaderMimeType.startsWith('image/')) {
    return normalizedHeaderMimeType;
  }

  return detectImageMimeTypeByExtension(sourceName);
};

const encodeBase64Bytes = (bytes) => {
  if (!Array.isArray(bytes) || !bytes.length) {
    return '';
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let encoded = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = Number(bytes[index] ?? 0) & 0xff;
    const second = Number(bytes[index + 1] ?? 0) & 0xff;
    const third = Number(bytes[index + 2] ?? 0) & 0xff;
    const triple = (first << 16) | (second << 8) | third;

    encoded += alphabet[(triple >> 18) & 0x3f];
    encoded += alphabet[(triple >> 12) & 0x3f];
    encoded += index + 1 < bytes.length ? alphabet[(triple >> 6) & 0x3f] : '=';
    encoded += index + 2 < bytes.length ? alphabet[triple & 0x3f] : '=';
  }

  return encoded;
};

const convertBytesToHexText = (bytes) => {
  if (!Array.isArray(bytes) || !bytes.length) {
    return '';
  }

  let hexText = '';
  for (let index = 0; index < bytes.length; index += 1) {
    hexText += Number(bytes[index] ?? 0).toString(16).padStart(2, '0');
  }

  return hexText;
};

const readSourceImageFromUpload = (record) => {
  const sourceImage = String(record.get('sourceImage') ?? '').trim();
  if (!sourceImage) {
    return {
      ok: false,
      errorMessage: '업로드 이미지 파일명이 비어 있습니다.',
    };
  }

  const fsys = $app.newFilesystem();
  const fileKey = $filepath.join(record.baseFilesPath(), sourceImage);
  let reader = null;

  try {
    reader = fsys.getFile(fileKey);
    const imageBytes = toBytes(reader);
    if (!Array.isArray(imageBytes) || !imageBytes.length) {
      return {
        ok: false,
        errorMessage: '업로드 이미지 파일을 읽지 못했습니다.',
      };
    }

    if (imageBytes.length > MAX_ANALYZE_IMAGE_BYTES) {
      return {
        ok: false,
        errorMessage: `이미지 용량이 너무 큽니다. (최대 ${MAX_ANALYZE_IMAGE_BYTES} bytes)`,
      };
    }

    const imageMimeType = resolveImageMimeType(imageBytes, reader?.contentType?.() ?? '', sourceImage);
    if (!imageMimeType) {
      return {
        ok: false,
        errorMessage: '지원하지 않는 이미지 형식입니다.',
      };
    }

    return {
      ok: true,
      imageBytes,
      imageMimeType,
      sourceText: sourceImage,
    };
  } catch (error) {
    return {
      ok: false,
      errorMessage: `업로드 이미지 조회 실패: ${toString(error)}`,
    };
  } finally {
    if (reader) {
      try {
        reader.close();
      } catch {}
    }

    try {
      fsys.close();
    } catch {}
  }
};

const readSourceImageFromUrl = (sourceUrl) => {
  const normalizedUrl = String(sourceUrl ?? '').trim();
  if (!normalizedUrl) {
    return {
      ok: false,
      errorMessage: '이미지 URL이 비어 있습니다.',
    };
  }

  let response = null;
  try {
    response = $http.send({
      headers: {
        accept: 'image/*,*/*;q=0.8',
      },
      method: 'GET',
      timeout: 45,
      url: normalizedUrl,
    });
  } catch (error) {
    return {
      ok: false,
      errorMessage: `이미지 URL 요청 실패: ${toString(error)}`,
    };
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    return {
      ok: false,
      errorMessage: `이미지 URL 다운로드 실패 (HTTP ${response.statusCode})`,
    };
  }

  const imageBytes = Array.isArray(response.body) ? response.body : toBytes(response.body);
  if (!Array.isArray(imageBytes) || !imageBytes.length) {
    return {
      ok: false,
      errorMessage: 'URL 이미지 본문이 비어 있습니다.',
    };
  }

  if (imageBytes.length > MAX_ANALYZE_IMAGE_BYTES) {
    return {
      ok: false,
      errorMessage: `이미지 용량이 너무 큽니다. (최대 ${MAX_ANALYZE_IMAGE_BYTES} bytes)`,
    };
  }

  const imageMimeType = resolveImageMimeType(imageBytes, readHeaderValue(response.headers, 'content-type'), normalizedUrl);
  if (!imageMimeType) {
    return {
      ok: false,
      errorMessage: 'URL 이미지의 MIME 타입을 확인할 수 없습니다.',
    };
  }

  return {
    ok: true,
    imageBytes,
    imageMimeType,
    sourceText: normalizedUrl,
  };
};

const readSourceImageForAnalyze = (record) => {
  const sourceType = String(record.get('sourceType') ?? '').trim();
  const sourceUrl = String(record.get('sourceUrl') ?? '').trim();
  const sourceImage = String(record.get('sourceImage') ?? '').trim();

  if ('url' === sourceType) {
    return readSourceImageFromUrl(sourceUrl);
  }

  if ('upload' === sourceType) {
    return readSourceImageFromUpload(record);
  }

  if (sourceImage) {
    return readSourceImageFromUpload(record);
  }

  if (sourceUrl) {
    return readSourceImageFromUrl(sourceUrl);
  }

  return {
    ok: false,
    errorMessage: '분석할 원본 이미지 정보를 찾지 못했습니다.',
  };
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

  let imageHash = '';
  if ('upload' === sourceType) {
    const sourceImageResult = readSourceImageFromUpload(record);
    if (!sourceImageResult.ok) {
      return {
        ok: false,
        errorCode: 'image_decode_error',
        errorMessage: sourceImageResult.errorMessage,
      };
    }

    const imageHexText = convertBytesToHexText(sourceImageResult.imageBytes);
    imageHash = $security.sha256(imageHexText);
  } else {
    const imageHashBase = sourceUrl || sourceImage || `${record.id}:${record.get('created')}`;
    imageHash = $security.md5(imageHashBase);
  }

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

  const sourceImageResult = readSourceImageForAnalyze(record);
  if (!sourceImageResult.ok) {
    logger.error('source image load failed', 'reason', sourceImageResult.errorMessage);
    return {
      ok: false,
      errorCode: 'image_decode_error',
      errorMessage: sourceImageResult.errorMessage,
    };
  }

  const prompt =
    '첨부된 의류 이미지를 직접 보고 카테고리/계절/색상/스타일/핏/소재/상황을 JSON 객체로 반환해.\n' +
    '코드펜스 없이 JSON만 반환.\n' +
    '이미지에 보이는 정보 중심으로 답하고, 확실하지 않은 값은 가장 근접한 enum 하나를 선택.\n' +
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
    `sourceText: ${sourceImageResult.sourceText || sourceText}\n`;

  const imageBase64 = encodeBase64Bytes(sourceImageResult.imageBytes);
  if (!imageBase64) {
    return {
      ok: false,
      errorCode: 'image_decode_error',
      errorMessage: '이미지 데이터를 base64로 변환하지 못했습니다.',
    };
  }

  const buildAnalyzeRequestBody = (useSnakeCase) => ({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          useSnakeCase
            ? {
                inline_data: {
                  data: imageBase64,
                  mime_type: sourceImageResult.imageMimeType,
                },
              }
            : {
                inlineData: {
                  data: imageBase64,
                  mimeType: sourceImageResult.imageMimeType,
                },
              },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
    },
  });

  let response = $http.send({
    body: JSON.stringify(buildAnalyzeRequestBody(true)),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
    timeout: 45,
    url: `https://generativelanguage.googleapis.com/v1beta/models/${ANALYZE_MODEL}:generateContent?key=${geminiApiKey}`,
  });

  let responseBody = toString(response.body);
  const shouldRetryWithCamelCase =
    response.statusCode >= 400 &&
    response.statusCode < 500 &&
    /inline_data|mime_type|unknown name|invalid json payload/i.test(responseBody);

  if (shouldRetryWithCamelCase) {
    response = $http.send({
      body: JSON.stringify(buildAnalyzeRequestBody(false)),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
      timeout: 45,
      url: `https://generativelanguage.googleapis.com/v1beta/models/${ANALYZE_MODEL}:generateContent?key=${geminiApiKey}`,
    });
    responseBody = toString(response.body);
  }

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

const readRelationIds = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item ?? '').trim()).filter(Boolean);
};

const deleteClothesById = (authRecord, clothesId) => {
  const authId = readAuthId(authRecord);
  if (!authId) {
    return {
      ok: false,
      statusCode: 401,
      message: '인증 정보가 필요합니다.',
    };
  }

  const normalizedClothesId = String(clothesId ?? '').trim();
  if (!normalizedClothesId) {
    return {
      ok: false,
      statusCode: 400,
      message: 'clothes id가 필요합니다.',
    };
  }

  const record = findClothesRecordById(normalizedClothesId);
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
      message: '본인 데이터만 삭제할 수 있습니다.',
    };
  }

  try {
    const recommendationItems = $app.findRecordsByFilter(
      RECOMMENDATION_ITEMS_COLLECTION,
      'user = {:userId} && clothes = {:clothesId}',
      '',
      0,
      0,
      { clothesId: normalizedClothesId, userId: authId },
    );

    let deletedRecommendationItemCount = 0;
    recommendationItems.forEach((item) => {
      if (!item) {
        return;
      }

      $app.delete(item);
      deletedRecommendationItemCount += 1;
    });

    const wearLogs = $app.findRecordsByFilter(WEAR_LOGS_COLLECTION, 'user = {:userId}', '', 0, 0, { userId: authId });
    let updatedWearLogCount = 0;
    let deletedWearLogCount = 0;

    wearLogs.forEach((wearLog) => {
      if (!wearLog) {
        return;
      }

      const itemIds = readRelationIds(wearLog.get('items'));
      if (!itemIds.includes(normalizedClothesId)) {
        return;
      }

      const nextItemIds = itemIds.filter((itemId) => itemId !== normalizedClothesId);
      if (!nextItemIds.length) {
        $app.delete(wearLog);
        deletedWearLogCount += 1;
        return;
      }

      wearLog.set('items', nextItemIds);
      $app.save(wearLog);
      updatedWearLogCount += 1;
    });

    $app.delete(record);

    return {
      ok: true,
      payload: {
        deletedRecommendationItemCount,
        deletedWearLogCount,
        id: normalizedClothesId,
        updatedWearLogCount,
      },
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: 500,
      message: `옷 삭제 처리 중 오류가 발생했습니다. ${toString(error)}`,
    };
  }
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
  deleteClothesById,
  processClothesPipeline,
  reembedClothesById,
  retryClothesById,
};
