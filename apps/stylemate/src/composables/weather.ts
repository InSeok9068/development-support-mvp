import pb from '@/api/pocketbase';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';

export type CityWeather = {
  date: string;
  location: string;
  maxTemp: number;
  minTemp: number;
  stale: boolean;
  updatedAt: string;
};

export type MajorCitiesWeather = {
  anyang: CityWeather | null;
  seongnam: CityWeather | null;
};

export const useWeather = () => {
  /* ======================= 변수 ======================= */
  const weatherQuery = useQuery({
    enabled: false,
    queryFn: () =>
      pb.send<MajorCitiesWeather>('/api/weather/major-cities-daily', {
        method: 'GET',
      }),
    queryKey: ['weathers', 'major-cities-daily'],
    staleTime: 10 * 60 * 1000,
  });
  const anyangWeather = computed(() => weatherQuery.data.value?.anyang ?? null);
  const seongnamWeather = computed(() => weatherQuery.data.value?.seongnam ?? null);
  const isWeatherLoading = computed(() => weatherQuery.isLoading.value);
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchMajorCitiesWeather = () => weatherQuery.refetch();
  /* ======================= 메서드 ======================= */

  return {
    anyangWeather,
    seongnamWeather,
    isWeatherLoading,

    fetchMajorCitiesWeather,
  };
};
