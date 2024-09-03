import pb from '@/api/pocketbase';
import { useModal } from '@/composables/modal';
import { type SettingJson, useSettingStore } from '@/stores/setting.store';
import { storeToRefs } from 'pinia';

export const useSetting = () => {
  /* ======================= 변수 ======================= */
  const { setting } = storeToRefs(useSettingStore());
  const { showMessageModal } = useModal();
  /* ======================= 변수 ======================= */

  /* ======================= 메서드 ======================= */
  const initSetting = async () => {
    await selectSetting();
  };

  const selectSetting = async () => {
    setting.value = (await pb.collection('settings').getFirstListItem('')).data as SettingJson;
  };

  const updateSetting = async () => {
    const settingDto = await pb.collection('settings').getFirstListItem('');
    settingDto.data = setting.value;
    await pb.collection('settings').update(settingDto.id, settingDto);
    showMessageModal('수정완료');
  };
  /* ======================= 메서드 ======================= */

  return {
    setting,

    initSetting,
    selectSetting,
    updateSetting,
  };
};
