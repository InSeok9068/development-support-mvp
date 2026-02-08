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

  const provider = request.formValue('provider') || 'toss';
  const baseCurrency = request.formValue('baseCurrency') || 'KRW';
  console.log('[report] formValues', { provider, baseCurrency });
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
  reportRecord.set('provider', provider);
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
              '이미지에서 종목명을 추출하고 아래 스키마로 JSON 배열만 반환해.\n' +
              '반드시 코드펜스 없이 순수 JSON만 반환.\n' +
              '\n' +
              '스키마:\n' +
              '[\n' +
              '  {\n' +
              '    "name": "종목명",\n' +
              '    "amount": "금액(문자열 가능)",\n' +
              '    "region": "KR | US | ETC 중 하나",\n' +
              '    "assetType": "stock | etf | fund | bond | cash | etc 중 하나",\n' +
              '    "sector": "가능하면 산업 섹터",\n' +
              '    "style": "가능하면 스타일(예: growth, value)",\n' +
              '    "ticker": "가능하면 티커",\n' +
              '    "exchange": "가능하면 거래소",\n' +
              '    "isBondLike": true/false\n' +
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
  const normalizeRegion = (value) => {
    const upper = String(value ?? '').toUpperCase();
    return upper === 'KR' || upper === 'US' || upper === 'ETC' ? upper : 'ETC';
  };
  const normalizeAssetType = (value) => {
    const lower = String(value ?? '').toLowerCase();
    const allowed = ['stock', 'etf', 'fund', 'bond', 'cash', 'etc'];
    return allowed.includes(lower) ? lower : 'etc';
  };

  const items = Array.isArray(parsedItems)
    ? parsedItems.map((item) => {
        const name = item.name ?? item['종목명'] ?? '';
        const amountText = item.amount ?? item['금액'] ?? '';
        const amountValue = Number(String(amountText).replace(/[^\d]/g, '')) || 0;
        const region = normalizeRegion(item.region);
        const assetType = normalizeAssetType(item.assetType);
        const sector = item.sector ?? '';
        const style = item.style ?? '';
        const ticker = item.ticker ?? '';
        const exchange = item.exchange ?? '';
        const isBondLike = Boolean(item.isBondLike);
        return { name, amountText, amountValue, region, assetType, sector, style, ticker, exchange, isBondLike };
      })
    : [];
  const validItems = items.filter((item) => item.name && item.amountValue > 0);
  const totalValue = validItems.reduce(
    (sum, item) => sum + (Number.isFinite(item.amountValue) ? item.amountValue : 0),
    0,
  );
  console.log('[report] parsed items', { count: items.length, totalValue });

  reportRecord.set('status', isSuccess ? 'done' : 'failed');
  reportRecord.set('totalValue', totalValue);
  $app.save(reportRecord);
  console.log('[report] report updated', { reportId: reportRecord.id, status: reportRecord.get('status') });

  if (!isSuccess) {
    console.log('[report] gemini request failed');
    return e.error(500, 'Gemini 요청 실패', {
      statusCode: geminiResponse.statusCode,
      body: responseBody,
    });
  }

  console.log('[report] done');
  const instrumentsCollection = $app.findCollectionByNameOrId('instruments');
  const holdingsCollection = $app.findCollectionByNameOrId('holdings');
  const matchLogsCollection = $app.findCollectionByNameOrId('match_logs');
  const savedHoldings = [];

  validItems.forEach((item) => {
    let instrumentRecord = null;
    let matchedBy = 'ai';
    let confidence = 0.2;
    if (item.name) {
      const found = $app.findRecordsByFilter('instruments', 'name = {:name}', '', 1, 0, { name: item.name });
      instrumentRecord = found?.[0] ?? null;
      if (instrumentRecord) {
        matchedBy = 'exact';
        confidence = 1;
      }
    }
    if (!instrumentRecord) {
      instrumentRecord = new Record(instrumentsCollection);
      instrumentRecord.set('name', item.name);
      instrumentRecord.set('region', item.region);
      instrumentRecord.set('assetType', item.assetType);
      if (item.sector) instrumentRecord.set('sector', item.sector);
      if (item.style) instrumentRecord.set('style', item.style);
      if (item.ticker) instrumentRecord.set('ticker', item.ticker);
      if (item.exchange) instrumentRecord.set('exchange', item.exchange);
      if (item.isBondLike) instrumentRecord.set('isBondLike', item.isBondLike);
      $app.save(instrumentRecord);
    }

    const holdingRecord = new Record(holdingsCollection);
    holdingRecord.set('reportId', reportRecord.id);
    holdingRecord.set('instrumentId', instrumentRecord?.id);
    holdingRecord.set('rawName', item.name);
    holdingRecord.set('region', item.region);
    holdingRecord.set('assetType', item.assetType);
    holdingRecord.set('value', item.amountValue);
    $app.save(holdingRecord);

    const matchLogRecord = new Record(matchLogsCollection);
    matchLogRecord.set('reportId', reportRecord.id);
    matchLogRecord.set('rawName', item.name);
    matchLogRecord.set('matchedBy', matchedBy);
    matchLogRecord.set('confidence', confidence);
    if (instrumentRecord?.id) {
      matchLogRecord.set('instrumentId', instrumentRecord.id);
    }
    $app.save(matchLogRecord);

    savedHoldings.push({ holdingId: holdingRecord.id, instrumentId: instrumentRecord?.id });
  });

  console.log('[report] holdings saved', { count: savedHoldings.length });

  return e.json(200, {
    reportId: reportRecord.id,
    status: 'done',
    gemini: responseBody,
    items: validItems,
    totalValue,
    savedHoldings,
  });
});
