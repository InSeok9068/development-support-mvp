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
import { useRouter } from 'vue-router';

const router = useRouter();

const { isAuth } = useSign();

isAuth.value = !!localStorage.getItem('pocketbase_auth');

!isAuth.value && router.push('/sign');
</script>
