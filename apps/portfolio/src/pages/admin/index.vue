<template>
  <main class="container mx-auto p-4">
    <div class="flex flex-col gap-4">
      <sl-card class="w-full">
        <div class="flex flex-col gap-3">
          <h3>관리자 메뉴</h3>
          <div class="flex flex-col gap-2">
            <sl-alert v-if="!isSuperuser" variant="warning" open>
              관리자 계정으로 로그인해야 사용할 수 있습니다.
            </sl-alert>
            <sl-alert v-else variant="success" open>
              관리자 권한이 확인되었습니다.
            </sl-alert>
          </div>

          <div class="flex items-center gap-2">
            <sl-button variant="default" @click="onClickBack">
              돌아가기
            </sl-button>
            <sl-button v-if="isAuth" variant="default" @click="onClickSignout">
              로그아웃
            </sl-button>
          </div>
        </div>
      </sl-card>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

/* ======================= 변수 ======================= */
const router = useRouter();
const { isAuth, isSuperuser, deleteAuthSession, fetchAuthState } = useAuth();
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
onMounted(() => {
  fetchAuthState();
});
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onClickBack = () => {
  router.push('/');
};

const onClickSignout = () => {
  deleteAuthSession();
  router.push('/');
};
/* ======================= 메서드 ======================= */
</script>
