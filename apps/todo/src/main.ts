// 1순위 인식
import '@/assets/style.css';
// 2순위 인식
import '@/assets/custom.css';

import { VueQueryPlugin } from '@tanstack/vue-query';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { routes } from 'vue-router/auto-routes';
import App from './App.vue';

const app = createApp(App);

const pinia = createPinia();
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

pinia.use(piniaPluginPersistedstate);

app.use(VueQueryPlugin);
app.use(router);
app.use(pinia);

app.mount('#app');
