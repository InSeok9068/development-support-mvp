// eslint-disable-next-line @typescript-eslint/triple-slash-reference
// @ts-nocheck
/// <reference path="types.d.ts" />

routerAdd('POST', '/api/match-failure/suggest', (e) => {
  if (!e.hasSuperuserAuth()) {
    return e.error(403, '관리자 권한이 필요합니다.', {});
  }

  const allowedCategories = [
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
  const allowedGroupTypes = ['liquid', 'risk', 'defensive', 'real'];
  const allowedTags = [
    'growth',
    'income',
    'blend',
    'low_vol',
    'high_risk',
    'stable',
    'theme',
    'inflation_hedge',
    'retirement',
    'tax_benefit',
  ];
  const allowedSectors = [
    'it_software',
    'semiconductor',
    'hardware_equipment',
    'telecom',
    'internet_platform',
    'finance',
    'bank',
    'insurance',
    'securities_asset_mgmt',
    'healthcare',
    'biotech_pharma',
    'consumer_discretionary',
    'consumer_staples',
    'retail',
    'auto',
    'industrials',
    'materials',
    'energy',
    'utilities',
    'real_estate',
    'transportation_logistics',
    'media_entertainment',
    'education',
    'construction',
  ];
  const defaultGroupTypeByCategory = {
    cash: 'liquid',
    deposit: 'defensive',
    stock: 'risk',
    etf: 'risk',
    bond: 'defensive',
    fund: 'risk',
    pension: 'defensive',
    crypto: 'risk',
    real_estate: 'real',
    reits: 'real',
    commodity_gold: 'real',
    insurance: 'defensive',
    car: 'real',
    etc: 'real',
  };

  const normalizeEnum = (value, allowed, fallback) => {
    const normalized = String(value ?? '')
      .trim()
      .toLowerCase();
    return allowed.includes(normalized) ? normalized : fallback;
  };

  const normalizeArrayEnum = (values, allowed) => {
    if (!Array.isArray(values)) {
      return [];
    }
    const seen = new Set();
    const normalized = [];
    values.forEach((value) => {
      const item = normalizeEnum(value, allowed, '');
      if (!item || seen.has(item)) {
        return;
      }
      seen.add(item);
      normalized.push(item);
    });
    return normalized;
  };

  const parseJsonSafely = (text, fallback) => {
    try {
      return JSON.parse(text);
    } catch {
      return fallback;
    }
  };

  const extractJsonObjectText = (text) => {
    const normalized = String(text ?? '')
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    const objectStart = normalized.indexOf('{');
    const objectEnd = normalized.lastIndexOf('}');
    if (objectStart === -1 || objectEnd === -1 || objectEnd <= objectStart) {
      return '{}';
    }
    return normalized.slice(objectStart, objectEnd + 1).trim();
  };

  const requestInfo = e.requestInfo();
  const rawName = String(requestInfo.body?.rawName ?? '').trim();
  const inputCategory = normalizeEnum(requestInfo.body?.category, allowedCategories, 'etc');

  if (!rawName) {
    return e.error(400, '종목명이 필요합니다.', {});
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return e.error(500, 'GEMINI_API_KEY가 설정되지 않았습니다.', {});
  }

  const prompt =
    '아래 종목명과 카테고리 힌트를 바탕으로 관리자 자산 분류를 추천해.\n' +
    '반드시 코드펜스 없이 JSON 객체만 반환.\n' +
    '허용 enum 외 값은 절대 사용하지 마.\n' +
    '\n' +
    `종목명: ${rawName}\n` +
    `카테고리 힌트: ${inputCategory}\n` +
    '\n' +
    `category enum: ${allowedCategories.join(', ')}\n` +
    `groupType enum: ${allowedGroupTypes.join(', ')}\n` +
    `tags enum: ${allowedTags.join(', ')}\n` +
    `sectors enum: ${allowedSectors.join(', ')}\n` +
    '\n' +
    '응답 스키마:\n' +
    '{\n' +
    '  "category": "enum",\n' +
    '  "groupType": "enum",\n' +
    '  "tags": ["enum"],\n' +
    '  "sectors": ["enum"]\n' +
    '}\n';

  const geminiPayload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
    },
  };

  const geminiResponse = $http.send({
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
    method: 'POST',
    body: JSON.stringify(geminiPayload),
    headers: {
      'content-type': 'application/json',
    },
  });

  const responseBody = toString(geminiResponse.body);
  const isSuccess = geminiResponse.statusCode >= 200 && geminiResponse.statusCode < 300;
  if (!isSuccess) {
    return e.error(500, 'AI 분류 추천 요청에 실패했습니다.', {
      statusCode: geminiResponse.statusCode,
      body: responseBody,
    });
  }

  const geminiPayloadJson = parseJsonSafely(responseBody, {});
  const geminiText = geminiPayloadJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const normalizedJsonText = extractJsonObjectText(geminiText);
  const parsedSuggestion = parseJsonSafely(normalizedJsonText, {});

  const category = normalizeEnum(parsedSuggestion?.category, allowedCategories, inputCategory);
  const groupType = normalizeEnum(
    parsedSuggestion?.groupType,
    allowedGroupTypes,
    defaultGroupTypeByCategory[category] ?? 'risk',
  );
  const tags = normalizeArrayEnum(parsedSuggestion?.tags, allowedTags);
  const sectors = normalizeArrayEnum(parsedSuggestion?.sectors, allowedSectors);

  return e.json(200, {
    category,
    groupType,
    tags,
    sectors,
  });
});
