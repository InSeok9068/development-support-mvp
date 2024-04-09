<template>
  <dialog v-show="!!message" id="modal" open>
    <article>
      <header>
        <button aria-label="Close" rel="prev" data-target="modal" @click="message = ''"></button>
        <h3>알림</h3>
      </header>
      <p>{{ message }}</p>
      <footer>
        <button role="button" class="secondary" data-target="modal" @click="message = ''">Cancel</button>
      </footer>
    </article>
  </dialog>
</template>

<script setup lang="ts">
import { useModal } from '@/composables/modal';

const { message } = useModal();
</script>
