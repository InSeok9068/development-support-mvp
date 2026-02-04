import pb from '@/api/pocketbase';
import { Collections, type SettingsResponse } from '@/api/pocketbase-types';
import { type SettingJson, useSettingStore } from '@/stores/setting.store';
import { useSign } from '@/composables/user/sign';
import { useModal } from '@packages/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';

export const useSetting = () => {
  /* ======================= 변수 ======================= */
  const { setting } = storeToRefs(useSettingStore());
  const { getUserId } = useSign();
  const { showMessageModal } = useModal();
  const queryClient = useQueryClient();
  const settingRecordId = ref<string | null>(null);

  const loadSettingRecord = async () => {
    const userId = getUserId();
    const settingList = await pb.collection(Collections.Settings).getList<SettingsResponse<SettingJson>>(1, 1, {
      filter: `user = "${userId}"`,
    });

    if (0 < settingList.items.length) {
      const record = settingList.items[0];
      return { id: record.id, data: record.data as SettingJson };
    }

    const created = await pb.collection(Collections.Settings).create<SettingsResponse<SettingJson>>({
      user: userId,
      data: setting.value,
    });

    return { id: created.id, data: created.data as SettingJson };
  };

  const settingQuery = useQuery({
    queryKey: ['settings'],
    queryFn: loadSettingRecord,
    enabled: false,
  });
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  watch(
    () => settingQuery.data.value,
    (data) => {
      if (data) {
        setting.value = data.data;
        settingRecordId.value = data.id;
      }
    },
    { immediate: true },
  );
  /* ======================= 감시자 ======================= */

  /* ======================= 메서드 ======================= */
  const initSetting = async () => {
    await fetchSetting();
  };

  const fetchSetting = async () => {
    const record = await queryClient.fetchQuery({
      queryKey: ['settings'],
      queryFn: loadSettingRecord,
    });
    setting.value = record.data;
    settingRecordId.value = record.id;
  };

  const updateSettingMutation = useMutation({
    mutationFn: async () => {
      const recordId =
        settingRecordId.value ??
        (
          await queryClient.fetchQuery({
            queryKey: ['settings'],
            queryFn: loadSettingRecord,
          })
        ).id;
      return pb.collection(Collections.Settings).update(recordId, { data: setting.value });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      showMessageModal('수정완료');
    },
  });

  const updateSetting = () => updateSettingMutation.mutateAsync();
  /* ======================= 메서드 ======================= */

  return {
    setting,

    initSetting,
    fetchSetting,
    updateSetting,
  };
};
