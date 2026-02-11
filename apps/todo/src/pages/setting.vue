<template>
  <main class="container mx-auto px-3 py-4 lg:px-4">
    <sl-card class="w-full shadow-sm">
      <div class="mb-6 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <sl-icon name="gear"></sl-icon>
          <h3 class="text-lg font-semibold">설정</h3>
        </div>
        <div class="text-xs text-slate-500">개발자 관리 및 앱 설정</div>
      </div>

      <div class="flex flex-col gap-6">
        <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <sl-icon name="people"></sl-icon>
              <h4 class="font-semibold">개발자 관리</h4>
            </div>
            <sl-tag size="small" variant="neutral">{{ developers.length }}명</sl-tag>
          </div>
          <SettingDeveloper
            v-model:developer-args="developerArgs"
            v-model:developers="developers"
            @save="onClickSaveDeveloper"
          />
        </section>

        <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <sl-icon name="sliders"></sl-icon>
              <h4 class="font-semibold">앱 설정</h4>
            </div>
            <sl-tag size="small" variant="neutral">기본 설정</sl-tag>
          </div>
          <SettingEtc v-model="setting" @save="onClickSaveSetting" />
        </section>
      </div>
    </sl-card>
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
const { developers, fetchDeveloperList, createDeveloper, updateDeveloper } = useDeveloper();
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
  fetchDeveloperList();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickSaveDeveloper = async () => {
  if (developerArgs.value.id) {
    await updateDeveloper(developerArgs.value);
    showMessageModal('수정 완료');
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createDeveloper(developerArgs.value as any);
    showMessageModal('등록 완료');
  }
};

const onClickSaveSetting = () => updateSetting();
/* ======================= 메서드 ======================= */
</script>
