import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface SettingJson {
  daysBefore: number;
}

export const useSettingStore = defineStore('setting', () => {
  const setting = ref<SettingJson>({
    daysBefore: 0,
  });

  return { setting };
});
