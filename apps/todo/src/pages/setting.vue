<template>
  <main class="container">
    <article>
      <SettingDeveloper v-model:developer-args="developerArgs" v-model:developers="developers" @save="onClickSave_1" />
      <SettingEtc v-model="setting" @save="onClickSave_2" />
    </article>
  </main>
</template>

<script setup lang="ts">
import pb from '@/api/pocketbase';
import SettingDeveloper from '@/components/setting/SettingDeveloper.vue';
import SettingEtc from '@/components/setting/SettingEtc.vue';
import { useModal } from '@packages/ui';
import { useSetting } from '@/composables/setting';
import { useDeveloper } from '@/composables/todo/developer';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import type { UiDeveloperArgs } from '@/ui/todo.ui';
import { onMounted, ref } from 'vue';

/* ======================= 변수 ======================= */
const { setting, fetchSetting, updateSetting } = useSetting();
const { showMessageModal } = useModal();
const { developers, fetchDevelopers } = useDeveloper();
const queryClient = useQueryClient();
const developerArgs = ref<UiDeveloperArgs>({
  id: '',
  user: pb.authStore.record?.id ?? '',
  name: '',
  sort: 1,
  leader: false,
  del: false,
});
const createDeveloperMutation = useMutation({
  mutationFn: (payload: UiDeveloperArgs) => pb.collection('developers').create(payload),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['developers'] });
    showMessageModal('등록 완료');
  },
});
const updateDeveloperMutation = useMutation({
  mutationFn: (payload: UiDeveloperArgs) => pb.collection('developers').update(payload.id, payload),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['developers'] });
    showMessageModal('수정 완료');
  },
});
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  fetchSetting();
  fetchDevelopers();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickSave_1 = async () => {
  if (developerArgs.value.id) {
    await updateDeveloperMutation.mutateAsync(developerArgs.value);
  } else {
    await createDeveloperMutation.mutateAsync(developerArgs.value);
  }
};

const onClickSave_2 = () => updateSetting();
/* ======================= 메서드 ======================= */
</script>
