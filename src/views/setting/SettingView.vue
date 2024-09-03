<template>
  <main class="container">
    <article>
      <SettingDeveloper v-model:developer-args="developerArgs" v-model:developers="developers" @save="onClickSave_1" />
      <SettingEtc v-model="setting" @save="onClickSave_2" />
    </article>
  </main>
</template>

<script setup lang="ts">
import SettingDeveloper from '@/components/setting/SettingDeveloper.vue';
import SettingEtc from '@/components/setting/SettingEtc.vue';
import { useSetting } from '@/composables/setting';
import { onMounted, ref } from 'vue';
import { useModal } from '@/composables/modal';
import pb from '@/api/pocketbase';
import { useDeveloper } from '@/composables/todo/developer';
import type { UiDeveloperArgs } from '@/ui/todo.ui';

/* ======================= 변수 ======================= */
const { setting, selectSetting, updateSetting } = useSetting();
const { showMessageModal } = useModal();
const { developers, selectDeveloperFullList } = useDeveloper();
const developerArgs = ref<UiDeveloperArgs>({
  id: '',
  user: pb.authStore.model?.id,
  name: '',
  sort: 1,
  leader: false,
  del: false,
});
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  selectSetting();
  selectDeveloperFullList();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickSave_1 = async () => {
  if (developerArgs.value.id) {
    await pb.collection('developers').update(developerArgs.value.id, developerArgs.value);
    showMessageModal('수정 완료');
  } else {
    await pb.collection('developers').create(developerArgs.value);
    showMessageModal('등록 완료');
  }
};

const onClickSave_2 = () => updateSetting();
/* ======================= 메서드 ======================= */
</script>
