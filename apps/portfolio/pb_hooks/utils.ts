// @ts-nocheck
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

const normalizeAssetCategory = (value) => {
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

const normalizeKey = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

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

const extractJsonArrayText = (text) => {
  let value = String(text ?? '').trim();
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

const normalizeEnum = (value, allowed, fallback) => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
};

const normalizeArrayEnum = (values, allowed, maxSelect) => {
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

module.exports = {
  encodeBase64,
  normalizeAssetCategory,
  parseNumber,
  normalizeKey,
  parseJsonSafely,
  extractJsonObjectText,
  extractJsonArrayText,
  normalizeEnum,
  normalizeArrayEnum,
};
