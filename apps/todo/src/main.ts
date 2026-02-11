// 1순위 인식
import '@/assets/style.css';
// 2순위 인식
import '@/assets/custom.css';

import { autoAnimatePlugin } from '@formkit/auto-animate/vue';
import { setBasePath } from '@shoelace-style/shoelace';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { routes } from 'vue-router/auto-routes';
import App from './App.vue';

// Shoelace CDN 경로 설정
setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/');

const app = createApp(App);

const pinia = createPinia();
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

pinia.use(piniaPluginPersistedstate);

app.use(autoAnimatePlugin);
app.use(VueQueryPlugin);
app.use(router);
app.use(pinia);

app.mount('#app');
