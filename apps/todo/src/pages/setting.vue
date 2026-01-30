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
import { useDeveloper } from '@/composables/todo/developer';
import { useSign } from '@/composables/user/sign';
import type { UiDeveloperArgs } from '@/ui/todo.ui';
import { useModal } from '@packages/ui';
import { onMounted, ref } from 'vue';

/* ======================= 변수 ======================= */
const { setting, fetchSetting, updateSetting } = useSetting();
const { showMessageModal } = useModal();
const { developers, fetchDevelopers, createDeveloper, updateDeveloper } = useDeveloper();
const { getUserId } = useSign();
const developerArgs = ref<UiDeveloperArgs>({
  id: '',
  user: getUserId(),
  name: '',
  sort: 1,
  leader: false,
  del: false,
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
    await updateDeveloper(developerArgs.value);
    showMessageModal('수정 완료');
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createDeveloper(developerArgs.value as any);
    showMessageModal('등록 완료');
  }
};

const onClickSave_2 = () => updateSetting();
/* ======================= 메서드 ======================= */
</script>
