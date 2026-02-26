// @ts-nocheck
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

const getHeaderValues = (headers, key) => {
  if (!headers) return [];

  const direct = headers[key] ?? headers[key.toLowerCase()] ?? headers[key.toUpperCase()];
  if (Array.isArray(direct)) return direct.map((item) => String(item));
  if (direct !== undefined && direct !== null) return [String(direct)];

  const matchedKey = Object.keys(headers).find((headerKey) => headerKey.toLowerCase() === key.toLowerCase());
  if (!matchedKey) return [];

  const matchedValue = headers[matchedKey];
  if (Array.isArray(matchedValue)) return matchedValue.map((item) => String(item));
  if (matchedValue !== undefined && matchedValue !== null) return [String(matchedValue)];

  return [];
};

const normalizeCookieHeader = (cookieHeader) => {
  if (!cookieHeader) return '';

  const cookieMap = {};
  String(cookieHeader)
    .split(';')
    .map((chunk) => chunk.trim())
    .filter((chunk) => !!chunk)
    .forEach((cookiePair) => {
      const separatorIndex = cookiePair.indexOf('=');
      if (separatorIndex === -1) return;
      const name = cookiePair.slice(0, separatorIndex).trim();
      const value = cookiePair.slice(separatorIndex + 1).trim();
      if (!name) return;
      cookieMap[name] = value;
    });

  return Object.keys(cookieMap)
    .map((name) => `${name}=${cookieMap[name]}`)
    .join('; ');
};

const extractCookieHeaderFromSetCookie = (setCookieHeaders) => {
  const cookieMap = {};

  setCookieHeaders.forEach((header) => {
    const cookiePair = String(header).split(';')[0].trim();
    if (!cookiePair) return;

    const separatorIndex = cookiePair.indexOf('=');
    if (separatorIndex === -1) return;

    const name = cookiePair.slice(0, separatorIndex).trim();
    const value = cookiePair.slice(separatorIndex + 1).trim();
    if (!name) return;

    cookieMap[name] = value;
  });

  return Object.keys(cookieMap)
    .map((name) => `${name}=${cookieMap[name]}`)
    .join('; ');
};

const mergeSetCookieIntoCookieHeader = (cookieHeader, responseHeaders) => {
  const setCookieHeaders = getHeaderValues(responseHeaders, 'Set-Cookie');
  if (!setCookieHeaders.length) return cookieHeader;

  const nextCookie = normalizeCookieHeader(extractCookieHeaderFromSetCookie(setCookieHeaders));
  if (!nextCookie) return cookieHeader;

  const merged = cookieHeader ? `${cookieHeader}; ${nextCookie}` : nextCookie;
  return normalizeCookieHeader(merged);
};

const detectAuthRequiredHtml = (html) => {
  const text = String(html ?? '');
  if (text.includes('/staff/auth/login_check') || text.includes('id="mng_id"')) return true;

  const redirectRegex = /location\.href\s*=\s*(?:'|")\s*\/staff\/auth\s*(?:'|")/i;
  return redirectRegex.test(text);
};

const decodeHtmlEntities = (text) => {
  const source = String(text ?? '');
  return source
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

const stripTags = (html) => {
  return decodeHtmlEntities(String(html ?? '').replace(/<[^>]*>/g, '')).trim();
};

const toAbsoluteKjcaUrl = (host, maybeRelativeUrl) => {
  const url = String(maybeRelativeUrl ?? '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('?')) return `${host}/diary/${url}`;
  if (url.startsWith('/?') && url.includes('bd_idx=')) return `${host}/diary${url}`;
  if (url.startsWith('/')) return `${host}${url}`;
  return `${host}/${url}`;
};

const isAllowedKjcaUrl = (host, url) => {
  const normalized = String(url ?? '').trim();
  return (
    normalized.startsWith(`${host}/`) ||
    normalized.startsWith('http://www.kjca.co.kr/') ||
    normalized.startsWith('https://www.kjca.co.kr/')
  );
};

const extractPrintUrlFromCell = (host, cellHtml) => {
  const source = decodeHtmlEntities(String(cellHtml ?? ''));
  if (!source) return '';

  const candidates = [];
  const quotedUrlRegex = /['"]((?:https?:\/\/|\/|\?)[^'"]+)['"]/gi;
  let urlMatch = null;
  while ((urlMatch = quotedUrlRegex.exec(source))) {
    const candidate = String(urlMatch[1] ?? '').trim();
    if (!candidate) continue;
    candidates.push(candidate);
  }

  const normalized = candidates
    .map((candidate) => candidate.trim())
    .filter((candidate) => !!candidate)
    .filter((candidate) => candidate !== '#')
    .filter((candidate) => !/^javascript:/i.test(candidate))
    .filter((candidate) => !/^void\(0\)/i.test(candidate));

  if (!normalized.length) return '';

  const preferred =
    normalized.find((candidate) => candidate.includes('bd_idx=')) ??
    normalized.find((candidate) => candidate.includes('/diary/') || candidate.startsWith('?site=')) ??
    normalized[0];

  return toAbsoluteKjcaUrl(host, preferred);
};

const parseTeamLeadRowsFromDiaryHtml = (diaryHtml, host) => {
  const html = String(diaryHtml ?? '');

  const rows = [];
  const trRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch = null;
  while ((trMatch = trRegex.exec(html))) {
    const trInner = trMatch[1] || '';
    if (!trInner.includes('data-label')) continue;

    const cellHtmlByLabel = {};
    const tdRegex = /<td\b[^>]*data-label\s*=\s*(['"])([^'"]+)\1[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch = null;
    while ((tdMatch = tdRegex.exec(trInner))) {
      const label = stripTags(tdMatch[2]);
      const cellInner = tdMatch[3] || '';
      if (!label) continue;
      cellHtmlByLabel[label] = cellInner;
    }

    const position = stripTags(cellHtmlByLabel['직책'] ?? '');
    if (position !== '팀장') continue;

    const dept = stripTags(cellHtmlByLabel['부서'] ?? '');
    const org = stripTags(cellHtmlByLabel['소속'] ?? '');
    const staffName = stripTags(cellHtmlByLabel['성명'] ?? '');
    const createdAt = stripTags(cellHtmlByLabel['등록일시'] ?? '');

    const printCell = String(cellHtmlByLabel['인쇄'] ?? '');
    const printUrl = extractPrintUrlFromCell(host, printCell);

    rows.push({
      org,
      dept,
      position,
      staffName,
      createdAt,
      printUrl,
    });
  }

  const seen = {};
  const departments = [];
  const uniqueRows = [];
  rows.forEach((row) => {
    const key = row.dept || '';
    if (!key) return;
    if (seen[key]) return;
    seen[key] = true;
    departments.push(key);
    uniqueRows.push(row);
  });

  return { rows: uniqueRows, departments };
};

const buildBrowserLikeHeaders = (host, cookieHeader, referer) => {
  const headers = {
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'identity',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    Host: host.replace(/^https?:\/\//i, ''),
  };

  if (cookieHeader) headers.Cookie = cookieHeader;
  if (referer) headers.Referer = referer;
  return headers;
};

const buildTodayDateText = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeReportDate = (value) => {
  const text = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return buildTodayDateText();
};

const escapeFilterValue = (value) => {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
};

const hashText = (text) => {
  const source = String(text ?? '');
  let hash = 0x811c9dc5;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    hash >>>= 0;
  }
  return `${hash.toString(16).padStart(8, '0')}-${source.length}`;
};

const extractDivInnerHtmlByClasses = (html, requiredClasses) => {
  const source = String(html ?? '');
  if (!source) return '';

  const divStartRegex = /<div\b[^>]*class\s*=\s*(['"])([^'"]*)\1[^>]*>/gi;
  let match = null;
  while ((match = divStartRegex.exec(source))) {
    const classValue = String(match[2] ?? '');
    const ok = requiredClasses.every((cls) => new RegExp(`\\b${cls}\\b`).test(classValue));
    if (!ok) continue;

    const openTagEndIndex = match.index + match[0].length;
    const tokenRegex = /<\/?div\b/gi;
    tokenRegex.lastIndex = openTagEndIndex;
    let depth = 1;

    let tokenMatch = null;
    while ((tokenMatch = tokenRegex.exec(source))) {
      const token = String(tokenMatch[0] ?? '').toLowerCase();
      if (token === '<div') {
        depth += 1;
        continue;
      }

      if (token === '</div') {
        depth -= 1;
        if (depth === 0) {
          const closeTagStartIndex = tokenMatch.index;
          return source.slice(openTagEndIndex, closeTagStartIndex);
        }
      }
    }

    return '';
  }

  return '';
};

const htmlToText = (html) => {
  const normalized = String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(td|th)>/gi, '\t')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '- ');
  return decodeHtmlEntities(normalized.replace(/<[^>]*>/g, ' '))
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\t+/g, ' | ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v ?? '').trim()).filter((v) => !!v);
};

const isNumericByteArray = (value) => {
  if (!Array.isArray(value)) return false;
  if (!value.length) return false;
  return value.every((item) => Number.isInteger(item) && item >= 0 && item <= 255);
};

const normalizeJsonArrayField = (value) => {
  if (Array.isArray(value)) {
    if (isNumericByteArray(value)) {
      const text = String(toString(value) ?? '').trim();
      if (!text) return [];
      const parsedFromBytes = parseJsonSafely(text, null);
      if (Array.isArray(parsedFromBytes)) return normalizeStringArray(parsedFromBytes);
      return [];
    }
    return normalizeStringArray(value);
  }
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    const parsed = parseJsonSafely(trimmed, null);
    if (Array.isArray(parsed)) return normalizeStringArray(parsed);
    return normalizeStringArray([trimmed]);
  }
  return [];
};

const inferGemini429Cause = (message, detailsText) => {
  const source = `${String(message ?? '')} ${String(detailsText ?? '')}`.toLowerCase();
  if (!source.trim()) return 'unknown';

  const hasQuotaSignal =
    source.includes('quota') ||
    source.includes('billing') ||
    source.includes('free tier') ||
    source.includes('resource_exhausted');
  if (hasQuotaSignal) return 'quota-or-billing-limit';

  const hasRateSignal =
    source.includes('rate') ||
    source.includes('too many requests') ||
    source.includes('per minute') ||
    source.includes('retry');
  if (hasRateSignal) return 'request-rate-limit';

  return 'unknown';
};

const stringifyGeminiErrorDetails = (details) => {
  if (!Array.isArray(details)) return '';
  return details
    .map((detail) => {
      if (detail === null || detail === undefined) return '';
      const text = `${detail}`;
      return text === '[object Object]' ? JSON.stringify(detail) : text;
    })
    .join(' | ');
};

module.exports = {
  parseJsonSafely,
  extractJsonObjectText,
  getHeaderValues,
  normalizeCookieHeader,
  extractCookieHeaderFromSetCookie,
  mergeSetCookieIntoCookieHeader,
  detectAuthRequiredHtml,
  decodeHtmlEntities,
  stripTags,
  toAbsoluteKjcaUrl,
  isAllowedKjcaUrl,
  extractPrintUrlFromCell,
  parseTeamLeadRowsFromDiaryHtml,
  buildBrowserLikeHeaders,
  normalizeReportDate,
  escapeFilterValue,
  hashText,
  extractDivInnerHtmlByClasses,
  htmlToText,
  normalizeStringArray,
  normalizeJsonArrayField,
  inferGemini429Cause,
  stringifyGeminiErrorDetails,
};
