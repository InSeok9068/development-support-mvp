<template>
  <Transition name="modal">
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
  </Transition>
</template>

<script setup lang="ts">
import { useModal } from './composables/modal';

const { modal, clearModal } = useModal();
</script>

<style scoped>
.modal-enter-active {
  transition: opacity 0.25s var(--ease-1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
