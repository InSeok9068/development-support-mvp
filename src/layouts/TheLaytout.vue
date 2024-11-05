<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <Component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.1s var(--ease-1);
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
