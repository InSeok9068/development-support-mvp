<template>
  <main class="container mx-auto p-4">
    <div class="flex flex-col gap-6">
      <sl-card class="w-full">
        <div class="flex flex-col gap-3">
          <h3 class="text-lg font-semibold">한 장의 사진으로 자산 리포트</h3>
          <p class="text-sm text-slate-600 dark:text-slate-300">
            토스 투자 화면 스크린샷 1장을 올리면 AI가 종목명과 금액을 추출하고,
            국내/해외 구분과 함께 자산 현황 리포트를 만들어줍니다.
          </p>
        </div>
      </sl-card>

      <sl-card class="w-full">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h4 class="font-semibold">이미지 업로드</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              지원 형식: JPG, PNG. 개인정보가 포함되지 않은 화면을 권장합니다.
            </p>
          </div>

          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium">투자 화면 스크린샷</span>
            <input type="file" accept="image/*" @change="onChangeUpload" />
            <span class="text-xs text-slate-500 dark:text-slate-400">
              한 장만 업로드 가능합니다.
            </span>
          </label>

          <div class="flex items-center gap-3">
            <sl-button variant="primary" :disabled="!selectedFileName">분석 시작</sl-button>
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {{ selectedFileName || '선택된 파일 없음' }}
            </span>
          </div>
        </div>
      </sl-card>
    </div>
  </main>
</template>

<script setup lang="ts">
/* ======================= 변수 ======================= */
import { ref } from 'vue';

const selectedFileName = ref('');
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
/* ======================= 감시자 ======================= */

/* ======================= 생명주기 훅 ======================= */
/* ======================= 생명주기 훅 ======================= */

/* ======================= 메서드 ======================= */
const onChangeUpload = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  selectedFileName.value = file?.name ?? '';
};
/* ======================= 메서드 ======================= */
</script>
