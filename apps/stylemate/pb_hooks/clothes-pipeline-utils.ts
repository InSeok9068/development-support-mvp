// @ts-nocheck

const CATEGORY_VALUES = ['top', 'bottom', 'shoes', 'accessory'];
const SEASON_VALUES = ['spring', 'summer', 'fall', 'winter'];
const COLOR_VALUES = ['red', 'orange', 'yellow', 'green', 'blue', 'navy', 'purple', 'pink', 'white', 'gray', 'black', 'brown', 'beige'];
const STYLE_VALUES = ['street', 'casual', 'classic', 'minimal', 'sporty', 'feminine', 'vintage', 'workwear', 'formal', 'chic'];
const FIT_VALUES = ['oversized', 'slim', 'wide', 'loose', 'regular'];
const MATERIAL_VALUES = ['cotton', 'knit', 'leather', 'denim', 'wool', 'linen', 'polyester', 'nylon', 'silk'];
const CONTEXT_VALUES = ['daily', 'work', 'wedding', 'date', 'travel', 'exercise', 'party', 'formal_event'];

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

const normalizeAnalysis = (raw) => {
  const source = raw && typeof raw === 'object' ? raw : {};

  return {
    category: normalizeEnum(source.category, CATEGORY_VALUES, 'accessory'),
    seasons: normalizeEnumArray(source.seasons, SEASON_VALUES, 4),
    colors: normalizeEnumArray(source.colors, COLOR_VALUES, 13),
    styles: normalizeEnumArray(source.styles, STYLE_VALUES, 10),
    fit: normalizeEnum(source.fit, FIT_VALUES, 'regular'),
    materials: normalizeEnumArray(source.materials, MATERIAL_VALUES, 9),
    contexts: normalizeEnumArray(source.contexts, CONTEXT_VALUES, 8),
  };
};

const buildFallbackAnalysis = (sourceText) => {
  const text = String(sourceText ?? '').toLowerCase();

  const category = text.includes('shoe') || text.includes('sneaker') ? 'shoes' : text.includes('pants') || text.includes('skirt') ? 'bottom' : text.includes('shirt') || text.includes('tee') || text.includes('hoodie') ? 'top' : 'accessory';

  const styles = [];
  if (text.includes('street') || text.includes('hoodie')) {
    styles.push('street');
  }
  if (text.includes('classic') || text.includes('formal')) {
    styles.push('classic');
  }
  if (text.includes('sport') || text.includes('active')) {
    styles.push('sporty');
  }
  if (!styles.length) {
    styles.push('casual');
  }

  const colors = [];
  if (text.includes('black')) colors.push('black');
  if (text.includes('white')) colors.push('white');
  if (text.includes('blue') || text.includes('navy')) colors.push('blue');
  if (text.includes('beige')) colors.push('beige');
  if (!colors.length) {
    colors.push('gray');
  }

  return {
    category,
    colors,
    contexts: ['daily'],
    fit: 'regular',
    materials: ['cotton'],
    seasons: ['spring', 'fall'],
    styles,
  };
};

const buildDeterministicEmbedding = (seedText, dimension = 32) => {
  const base = String(seedText ?? '');
  const embedding = [];
  let offset = 0;

  while (embedding.length < dimension) {
    const hash = $security.md5(`${base}:${offset}`);

    for (let index = 0; index < hash.length && embedding.length < dimension; index += 8) {
      const chunk = hash.slice(index, index + 8);
      const parsed = Number.parseInt(chunk, 16);
      if (!Number.isFinite(parsed)) {
        continue;
      }

      const normalized = (parsed / 0xffffffff) * 2 - 1;
      embedding.push(Number(normalized.toFixed(6)));
    }

    offset += 1;
  }

  return embedding;
};

module.exports = {
  buildDeterministicEmbedding,
  buildFallbackAnalysis,
  extractJsonObjectText,
  normalizeAnalysis,
  parseJsonSafely,
};
