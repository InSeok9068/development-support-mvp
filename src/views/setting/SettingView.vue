<template>
  <main class="container">
    <article>
      <SettingDeveloper v-model:developer-args="developerArgs" v-model:developers="developers" @save="onClickSave_1" />
      <SettingEtc @save="onClickSave_2" />
    </article>
  </main>
</template>

<script setup lang="ts">
import SettingDeveloper from '@/components/setting/SettingDeveloper.vue';
import SettingEtc from '@/components/setting/SettingEtc.vue';
import { useDeveloper } from '@/composables/todo/developer';
import { onMounted } from 'vue';

const { developerArgs, developers, selectDeveloperFullList, createDeveloper, updateDeveloper } = useDeveloper();

onMounted(() => {
  selectDeveloperFullList();
});

const onClickSave_1 = () => {
  if (developerArgs.value.id) {
    updateDeveloper();
  } else {
    createDeveloper();
  }
};

const onClickSave_2 = () => {};
</script>
