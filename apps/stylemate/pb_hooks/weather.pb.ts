// @ts-nocheck

{
  const logger = $app.logger().with('hook', 'stylemate-weather', 'reason', 'startup');
  const { refreshMajorCitiesWeatherCache } = require(`${__hooks}/weather-service.ts`);
  const result = refreshMajorCitiesWeatherCache(true);
  if (!result.ok) {
    logger.error('weather refresh failed', 'message', result.message ?? 'unknown');
  }
}

cronAdd('stylemate-weather-major-cities-daily', '5 0 * * *', () => {
  const logger = $app.logger().with('hook', 'stylemate-weather', 'reason', 'cron');
  const { refreshMajorCitiesWeatherCache } = require(`${__hooks}/weather-service.ts`);
  const result = refreshMajorCitiesWeatherCache(true);
  if (!result.ok) {
    logger.error('weather refresh failed', 'message', result.message ?? 'unknown');
  }
});

routerAdd(
  'GET',
  '/api/weather/major-cities-daily',
  (e) => {
    const { fetchMajorCitiesWeatherCache } = require(`${__hooks}/weather-service.ts`);
    const result = fetchMajorCitiesWeatherCache();
    if (!result.ok) {
      return e.error(result.statusCode ?? 502, result.message ?? '날씨 데이터를 불러오지 못했습니다.', {});
    }

    return e.json(200, result.payload);
  },
  $apis.requireAuth(),
);

routerAdd(
  'GET',
  '/api/weather/anyang-daily',
  (e) => {
    const { fetchAnyangWeatherCache } = require(`${__hooks}/weather-service.ts`);
    const result = fetchAnyangWeatherCache();
    if (!result.ok) {
      return e.error(result.statusCode ?? 502, result.message ?? '날씨 데이터를 불러오지 못했습니다.', {});
    }

    return e.json(200, result.payload);
  },
  $apis.requireAuth(),
);
