// @ts-nocheck

const WEATHER_LOCATION_CONFIGS = {
  anyang: {
    label: '안양',
    latitude: 37.3925,
    longitude: 126.9268,
  },
  seongnam: {
    label: '성남',
    latitude: 37.4201,
    longitude: 127.1262,
  },
};

const buildWeatherApiUrl = (latitude, longitude) => {
  return `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FSeoul&forecast_days=1`;
};

const weatherCache = {
  anyang: {
    date: '',
    maxTemp: null,
    minTemp: null,
    stale: false,
    updatedAt: '',
  },
  seongnam: {
    date: '',
    maxTemp: null,
    minTemp: null,
    stale: false,
    updatedAt: '',
  },
};

const buildKstDateText = () => {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
};

const parseJsonSafely = (text, fallback) => {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};

const fetchWeatherFromOpenMeteo = (locationKey) => {
  const config = WEATHER_LOCATION_CONFIGS[locationKey];
  if (!config) {
    return {
      ok: false,
      message: '지원하지 않는 지역입니다.',
    };
  }

  const response = $http.send({
    method: 'GET',
    timeout: 20,
    url: buildWeatherApiUrl(config.latitude, config.longitude),
  });

  const responseBody = toString(response.body);
  if (response.statusCode < 200 || response.statusCode >= 300) {
    return {
      ok: false,
      message: `${config.label} 날씨 API 요청 실패 (HTTP ${response.statusCode})`,
    };
  }

  const payload = parseJsonSafely(responseBody, {});
  const date = String(payload?.daily?.time?.[0] ?? '').trim();
  const maxTemp = Number(payload?.daily?.temperature_2m_max?.[0]);
  const minTemp = Number(payload?.daily?.temperature_2m_min?.[0]);

  if (!date || !Number.isFinite(maxTemp) || !Number.isFinite(minTemp)) {
    return {
      ok: false,
      message: `${config.label} 날씨 API 응답값이 올바르지 않습니다.`,
    };
  }

  return {
    ok: true,
    payload: {
      date,
      maxTemp: Number(maxTemp.toFixed(1)),
      minTemp: Number(minTemp.toFixed(1)),
    },
  };
};

const buildWeatherPayload = (locationKey) => {
  const config = WEATHER_LOCATION_CONFIGS[locationKey];
  const cache = weatherCache[locationKey];
  return {
    date: cache.date,
    location: config.label,
    maxTemp: cache.maxTemp,
    minTemp: cache.minTemp,
    stale: cache.stale,
    updatedAt: cache.updatedAt,
  };
};

const refreshLocationWeatherCache = (locationKey, forceRefresh = false) => {
  const config = WEATHER_LOCATION_CONFIGS[locationKey];
  const cache = weatherCache[locationKey];
  if (!config || !cache) {
    return {
      ok: false,
      message: '지원하지 않는 지역입니다.',
      statusCode: 400,
    };
  }

  const today = buildKstDateText();
  const hasCache = Number.isFinite(cache.maxTemp) && Number.isFinite(cache.minTemp) && cache.date;
  if (!forceRefresh && hasCache && cache.date === today) {
    return {
      ok: true,
      payload: buildWeatherPayload(locationKey),
    };
  }

  const fetchResult = fetchWeatherFromOpenMeteo(locationKey);
  if (!fetchResult.ok) {
    if (hasCache) {
      cache.stale = true;
      return {
        ok: true,
        payload: buildWeatherPayload(locationKey),
      };
    }

    return {
      ok: false,
      message: fetchResult.message,
      statusCode: 502,
    };
  }

  cache.date = fetchResult.payload.date;
  cache.maxTemp = fetchResult.payload.maxTemp;
  cache.minTemp = fetchResult.payload.minTemp;
  cache.stale = false;
  cache.updatedAt = new Date().toISOString();

  return {
    ok: true,
    payload: buildWeatherPayload(locationKey),
  };
};

const refreshMajorCitiesWeatherCache = (forceRefresh = false) => {
  const anyangResult = refreshLocationWeatherCache('anyang', forceRefresh);
  const seongnamResult = refreshLocationWeatherCache('seongnam', forceRefresh);

  const hasAnyPayload = anyangResult.ok || seongnamResult.ok;
  if (!hasAnyPayload) {
    return {
      ok: false,
      message: `${anyangResult.message ?? '안양 날씨 실패'} / ${seongnamResult.message ?? '성남 날씨 실패'}`,
      statusCode: 502,
    };
  }

  return {
    ok: true,
    payload: {
      anyang: anyangResult.ok ? anyangResult.payload : null,
      seongnam: seongnamResult.ok ? seongnamResult.payload : null,
    },
  };
};

const fetchMajorCitiesWeatherCache = () => {
  return refreshMajorCitiesWeatherCache(false);
};

const refreshAnyangWeatherCache = (forceRefresh = false) => {
  return refreshLocationWeatherCache('anyang', forceRefresh);
};

const fetchAnyangWeatherCache = () => {
  return refreshLocationWeatherCache('anyang', false);
};

module.exports = {
  fetchAnyangWeatherCache,
  fetchMajorCitiesWeatherCache,
  refreshAnyangWeatherCache,
  refreshMajorCitiesWeatherCache,
};
