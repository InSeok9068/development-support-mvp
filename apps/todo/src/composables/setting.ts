import pb from '@/api/pocketbase';
import { Collections, type SettingsResponse } from '@/api/pocketbase-types';
import { type SettingJson, useSettingStore } from '@/stores/setting.store';
import { useModal } from '@packages/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';

export const useSetting = () => {
  /* ======================= 변수 ======================= */
  const { setting } = storeToRefs(useSettingStore());
  const { showMessageModal } = useModal();
  const queryClient = useQueryClient();
  const settingRecordId = ref<string | null>(null);

  const loadSettingRecord = async () => {
    const record = await pb.collection(Collections.Settings).getFirstListItem<SettingsResponse<SettingJson>>('');
    return { id: record.id, data: record.data as SettingJson };
  };

  const settingQuery = useQuery({
    queryKey: ['settings'],
    queryFn: loadSettingRecord,
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
