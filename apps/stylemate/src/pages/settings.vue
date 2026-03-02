<template>
  <main class="page-enter mx-auto flex min-h-screen w-full max-w-md flex-col gap-3 px-4 pb-24 pt-4">
    <header class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">설정</h1>
      <sl-button size="small" @click="onClickSignoutButton">로그아웃</sl-button>
    </header>

    <sl-card>
      <div class="flex flex-col gap-3">
        <div class="text-sm font-semibold">회원 정보</div>

        <div class="grid grid-cols-[72px_1fr] items-center gap-2">
          <div class="text-sm">아이디</div>
          <div class="text-sm font-semibold">{{ authUserIdLabel }}</div>
        </div>

        <div class="grid grid-cols-[72px_1fr] items-center gap-2">
          <div class="text-sm">이름</div>
          <div class="text-sm font-semibold">{{ authUserNameLabel }}</div>
        </div>
      </div>
    </sl-card>

    <AppBottomNav />
  </main>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/auth';
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const router = useRouter();
const { fetchAuthState, fetchAuthUserId, fetchAuthUserName, deleteAuthSession } = useAuth();
const authUserIdLabel = computed(() => fetchAuthUserId() || '-');
const authUserNameLabel = computed(() => fetchAuthUserName() || '-');
/* ======================= 변수 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(async () => {
  if (!fetchAuthState()) {
    await router.push('/sign');
  }
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickSignoutButton = async () => {
  await deleteAuthSession();
};
/* ======================= 메서드 ======================= */
</script>
