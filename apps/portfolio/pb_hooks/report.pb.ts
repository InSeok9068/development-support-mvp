// eslint-disable-next-line @typescript-eslint/triple-slash-reference
// @ts-nocheck
/// <reference path="types.d.ts" />

routerAdd('POST', '/api/report', (e) => {
  console.log('[report] start');

  const encodeBase64 = (bytes) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const output = new Array(Math.ceil(bytes.length / 3) * 4);
    let outIndex = 0;
    for (let i = 0; i < bytes.length; i += 3) {
      const b1 = bytes[i] ?? 0;
      const b2 = bytes[i + 1] ?? 0;
      const b3 = bytes[i + 2] ?? 0;

      const hasB2 = i + 1 < bytes.length;
      const hasB3 = i + 2 < bytes.length;

      const triplet = (b1 << 16) | (b2 << 8) | b3;

      output[outIndex++] = chars[(triplet >> 18) & 63];
      output[outIndex++] = chars[(triplet >> 12) & 63];
      output[outIndex++] = hasB2 ? chars[(triplet >> 6) & 63] : '=';
      output[outIndex++] = hasB3 ? chars[triplet & 63] : '=';
    }

    return output.join('');
  };

  const request = e.request;
  const [file, fileHeader] = request.formFile('image');
  console.log('[report] formFile image', { hasFile: !!file, hasHeader: !!fileHeader });

  if (!file || !fileHeader) {
    return e.error(400, '이미지 파일이 필요합니다.', {});
  }

  const baseCurrency = request.formValue('baseCurrency') || 'KRW';
  console.log('[report] formValues', { baseCurrency });

  const fileBytes = toBytes(file);
  const fileHash = $security.md5(toString(fileBytes));
  const fileName = fileHeader.filename || 'upload';

  file.close();
  console.log('[report] file parsed', { fileName, fileHash, byteLength: fileBytes.length });

  const contentTypeHeader = fileHeader.header?.get ? fileHeader.header.get('Content-Type') : null;
  const mimeType =
    contentTypeHeader ||
    (fileHeader.header && fileHeader.header['Content-Type'] ? fileHeader.header['Content-Type'][0] : '') ||
    'image/png';

  const reportCollection = $app.findCollectionByNameOrId('reports');
  const reportRecord = new Record(reportCollection);
  reportRecord.set('sourceImageUrl', fileName);
  reportRecord.set('sourceImageHash', fileHash);
  reportRecord.set('baseCurrency', baseCurrency);
  reportRecord.set('totalValue', 0);
  reportRecord.set('status', 'processing');
  $app.save(reportRecord);
  console.log('[report] report created', { reportId: reportRecord.id });

  const geminiApiKey = process.env.GEMINI_API_KEY;
  console.log('[report] has GEMINI_API_KEY', !!geminiApiKey);
  if (!geminiApiKey) {
    console.log('[report] missing GEMINI_API_KEY');
    reportRecord.set('status', 'failed');
    $app.save(reportRecord);
    return e.error(500, 'GEMINI_API_KEY가 설정되지 않았습니다.', {});
  }

  console.log('[report] before encodeBase64', { byteLength: fileBytes.length });
  const fileBase64 = encodeBase64(fileBytes);
  console.log('[report] after encodeBase64', { base64Length: fileBase64.length });

  const geminiPayload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              '이미지에서 자산 정보를 추출하고 아래 스키마로 JSON 배열만 반환해.\n' +
              '반드시 코드펜스 없이 순수 JSON만 반환.\n' +
              '카테고리는 아래 enum 중 하나만 사용.\n' +
              '\n' +
              '카테고리 enum:\n' +
              'cash, deposit, stock, etf, bond, fund, pension, crypto, real_estate, reits, commodity_gold, insurance, car, etc\n' +
              '\n' +
              '스키마:\n' +
              '[\n' +
              '  {\n' +
              '    "name": "자산명",\n' +
              '    "category": "카테고리",\n' +
              '    "amount": "금액(숫자 또는 문자열)",\n' +
              '    "profit": "손익금액(없으면 null)",\n' +
              '    "profitRate": "손익률(없으면 null)",\n' +
              '    "quantity": "수량(없으면 null)"\n' +
              '  }\n' +
              ']\n',
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: fileBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };

  console.log('[report] before gemini send');
  const geminiResponse = $http.send({
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
    method: 'POST',
    body: JSON.stringify(geminiPayload),
    headers: {
      'content-type': 'application/json',
    },
  });
  console.log('[report] after gemini send');

  const responseBody = toString(geminiResponse.body);
  const isSuccess = geminiResponse.statusCode >= 200 && geminiResponse.statusCode < 300;
  console.log('[report] gemini response', { statusCode: geminiResponse.statusCode });
  console.log('[report] gemini body', responseBody);

  if (!isSuccess) {
    reportRecord.set('status', 'failed');
    $app.save(reportRecord);
    console.log('[report] gemini request failed');
    return e.error(500, 'Gemini 요청 실패', {
      statusCode: geminiResponse.statusCode,
      body: responseBody,
    });
  }

  const extractJsonText = (text) => {
    let value = (text ?? '').trim();
    value = value
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    const arrayStart = value.indexOf('[');
    const arrayEnd = value.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      value = value.slice(arrayStart, arrayEnd + 1).trim();
    }
    return value;
  };

  const geminiPayloadJson = JSON.parse(responseBody);
  const geminiText = geminiPayloadJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const normalizedJsonText = extractJsonText(geminiText);
  const parsedItems = JSON.parse(normalizedJsonText);

  const normalizeCategory = (value) => {
    const lower = String(value ?? '').toLowerCase();
    const allowed = [
      'cash',
      'deposit',
      'stock',
      'etf',
      'bond',
      'fund',
      'pension',
      'crypto',
      'real_estate',
      'reits',
      'commodity_gold',
      'insurance',
      'car',
      'etc',
    ];
    return allowed.includes(lower) ? lower : 'etc';
  };

  const parseNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    const normalized = String(value ?? '').replace(/[^0-9.-]/g, '');
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return parsed;
  };

  const items = Array.isArray(parsedItems)
    ? parsedItems.map((item) => {
        const rawName = String(item.name ?? item['자산명'] ?? item['종목명'] ?? '').trim();
        const category = normalizeCategory(item.category ?? item['카테고리'] ?? item['자산카테고리']);
        const amount = parseNumber(item.amount ?? item['금액'] ?? item['자산금액']) ?? 0;
        const profit = parseNumber(item.profit ?? item['손익'] ?? item['손익금액']);
        const profitRate = parseNumber(item.profitRate ?? item['손익률']);
        const quantity = parseNumber(item.quantity ?? item['수량']);
        return { rawName, category, amount, profit, profitRate, quantity };
      })
    : [];

  const validItems = items.filter((item) => item.rawName && item.amount > 0);
  const totalValue = validItems.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0);
  const hasProfit = validItems.some((item) => Number.isFinite(item.profit));
  const totalProfit = hasProfit
    ? validItems.reduce((sum, item) => sum + (Number.isFinite(item.profit) ? item.profit : 0), 0)
    : null;
  const totalProfitRate =
    totalProfit !== null && totalValue > 0 ? (totalProfit / totalValue) * 100 : null;
  console.log('[report] parsed items', { count: items.length, totalValue });

  const normalizeKey = (value) => String(value ?? '').trim().toLowerCase();
  const adminAssets = $app.findAllRecords('admin_assets') || [];
  const adminNameMap = new Map();
  const adminAliasMap = new Map();

  adminAssets.forEach((record) => {
    const nameKey = normalizeKey(record.get('name'));
    if (nameKey) {
      adminNameMap.set(nameKey, record);
    }

    ['alias1', 'alias2', 'alias3'].forEach((field) => {
      const aliasKey = normalizeKey(record.get(field));
      if (aliasKey && !adminAliasMap.has(aliasKey)) {
        adminAliasMap.set(aliasKey, record);
      }
    });
  });

  const extractedCollection = $app.findCollectionByNameOrId('extracted_assets');
  const matchLogsCollection = $app.findCollectionByNameOrId('match_logs');
  const responseItems = [];

  validItems.forEach((item) => {
    const key = normalizeKey(item.rawName);
    let adminAssetRecord = key ? adminNameMap.get(key) : null;
    let matchedBy = adminAssetRecord ? 'exact' : 'ai';
    let confidence = adminAssetRecord ? 1 : 0;

    if (!adminAssetRecord && key) {
      adminAssetRecord = adminAliasMap.get(key) ?? null;
      if (adminAssetRecord) {
        matchedBy = 'alias';
        confidence = 0.8;
      }
    }

    const extractedRecord = new Record(extractedCollection);
    extractedRecord.set('reportId', reportRecord.id);
    extractedRecord.set('rawName', item.rawName);
    extractedRecord.set('category', item.category);
    extractedRecord.set('amount', item.amount);
    if (item.profit !== null) extractedRecord.set('profit', item.profit);
    if (item.profitRate !== null) extractedRecord.set('profitRate', item.profitRate);
    if (item.quantity !== null) extractedRecord.set('quantity', item.quantity);
    if (adminAssetRecord?.id) extractedRecord.set('adminAssetId', adminAssetRecord.id);
    $app.save(extractedRecord);

    const matchLogRecord = new Record(matchLogsCollection);
    matchLogRecord.set('reportId', reportRecord.id);
    matchLogRecord.set('rawName', item.rawName);
    matchLogRecord.set('matchedBy', matchedBy);
    matchLogRecord.set('confidence', confidence);
    matchLogRecord.set('status', adminAssetRecord ? 'confirmed' : 'pending');
    if (adminAssetRecord?.id) {
      matchLogRecord.set('adminAssetId', adminAssetRecord.id);
    }
    $app.save(matchLogRecord);

    const adminAsset = adminAssetRecord
      ? {
          id: adminAssetRecord.id,
          name: adminAssetRecord.get('name'),
          category: adminAssetRecord.get('category'),
          groupType: adminAssetRecord.get('groupType'),
          tags: adminAssetRecord.get('tags') ?? [],
          sectors: adminAssetRecord.get('sectors') ?? [],
        }
      : null;

    responseItems.push({
      extractedAssetId: extractedRecord.id,
      rawName: item.rawName,
      category: item.category,
      amount: item.amount,
      profit: item.profit,
      profitRate: item.profitRate,
      quantity: item.quantity,
      matched: !!adminAssetRecord,
      adminAsset,
    });
  });

  reportRecord.set('status', 'done');
  reportRecord.set('totalValue', totalValue);
  if (totalProfit !== null) {
    reportRecord.set('totalProfit', totalProfit);
  }
  if (totalProfitRate !== null) {
    reportRecord.set('totalProfitRate', totalProfitRate);
  }
  $app.save(reportRecord);
  console.log('[report] report updated', { reportId: reportRecord.id, status: reportRecord.get('status') });

  console.log('[report] done');
  return e.json(200, {
    reportId: reportRecord.id,
    status: reportRecord.get('status'),
    baseCurrency,
    totalValue,
    totalProfit,
    totalProfitRate,
    items: responseItems,
  });
});
