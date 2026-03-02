const KO_LOCALE = 'ko-KR';
const SEOUL_TIME_ZONE = 'Asia/Seoul';

export type KoreanDateInput = Date | number | string | null | undefined;

export type KoreanDateFormatPreset =
  | 'date'
  | 'date-weekday'
  | 'dot-date'
  | 'dot-date-weekday'
  | 'time'
  | 'date-time';

const DATE_FORMATTER = new Intl.DateTimeFormat(KO_LOCALE, {
  day: 'numeric',
  month: 'long',
  timeZone: SEOUL_TIME_ZONE,
  year: 'numeric',
});

const DATE_WEEKDAY_FORMATTER = new Intl.DateTimeFormat(KO_LOCALE, {
  day: 'numeric',
  month: 'long',
  timeZone: SEOUL_TIME_ZONE,
  weekday: 'short',
  year: 'numeric',
});

const DOT_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat(KO_LOCALE, {
  day: '2-digit',
  month: '2-digit',
  timeZone: SEOUL_TIME_ZONE,
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat(KO_LOCALE, {
  hour: 'numeric',
  hour12: true,
  minute: '2-digit',
  timeZone: SEOUL_TIME_ZONE,
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat(KO_LOCALE, {
  timeZone: SEOUL_TIME_ZONE,
  weekday: 'short',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(KO_LOCALE, {
  day: '2-digit',
  hour: 'numeric',
  hour12: true,
  minute: '2-digit',
  month: '2-digit',
  timeZone: SEOUL_TIME_ZONE,
  year: 'numeric',
});

const toDotDateText = (date: Date) => {
  const parts = DOT_DATE_PARTS_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return year && month && day ? `${year}.${month}.${day}` : '';
};

export const formatKoreanDate = (date: Date, preset: KoreanDateFormatPreset = 'date-weekday') => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  switch (preset) {
    case 'date':
      return DATE_FORMATTER.format(date);
    case 'date-weekday':
      return DATE_WEEKDAY_FORMATTER.format(date);
    case 'dot-date':
      return toDotDateText(date);
    case 'dot-date-weekday': {
      const dotDateText = toDotDateText(date);
      const weekdayText = WEEKDAY_FORMATTER.format(date);
      return dotDateText ? `${dotDateText} (${weekdayText})` : '';
    }
    case 'time':
      return TIME_FORMATTER.format(date);
    case 'date-time':
      return DATE_TIME_FORMATTER.format(date);
    default:
      return DATE_WEEKDAY_FORMATTER.format(date);
  }
};

export const formatKoreanDateKey = (date: Date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const parts = DOT_DATE_PARTS_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return year && month && day ? `${year}-${month}-${day}` : '';
};

export const parseKoreanDateInput = (value: KoreanDateInput) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const parsed = new Date(`${normalized}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const isoText = normalized.includes(' ') && normalized.endsWith('Z') ? normalized.replace(' ', 'T') : normalized;
  const parsed = new Date(isoText);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatKoreanDateFromInput = (value: KoreanDateInput, preset: KoreanDateFormatPreset = 'date-weekday', fallback = '') => {
  const parsed = parseKoreanDateInput(value);
  if (!parsed) {
    return fallback;
  }

  const formatted = formatKoreanDate(parsed, preset);
  return formatted || fallback;
};

export const formatKoreanDateKeyFromInput = (value: KoreanDateInput, fallback = '') => {
  const parsed = parseKoreanDateInput(value);
  if (!parsed) {
    return fallback;
  }

  const dateKey = formatKoreanDateKey(parsed);
  return dateKey || fallback;
};
