<template>
  <dialog v-show="modal.show" id="modal" open>
    <article>
      <header>
        <button aria-label="Close" rel="prev" data-target="modal" @click="clearModal"></button>
        <h3>{{ modal.title }}</h3>
      </header>
      <p>{{ modal.message }}</p>
      <footer>
        <button role="button" class="secondary" data-target="modal" @click="clearModal">Cancel</button>
      </footer>
    </article>
  </dialog>
</template>

<script setup lang="ts">
import { useModal } from '@/composables/modal';

const { modal, clearModal } = useModal();
</script>
