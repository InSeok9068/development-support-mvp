<template>
  <TheLayoutNavi></TheLayoutNavi>
  <TheLaytout></TheLaytout>
  <AppModal></AppModal>
</template>

<script setup>
import AppModal from '@/components/app/AppModal.vue';
import { useSign } from '@/composables/sign';
import TheLayoutNavi from '@/layouts/TheLayoutNavi.vue';
import TheLaytout from '@/layouts/TheLaytout.vue';

const { isAuth } = useSign();

isAuth.value = !!localStorage.getItem('pocketbase_auth');
</script>
