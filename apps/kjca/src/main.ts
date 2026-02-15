import '@/assets/style.css';
import '@/assets/custom.css';

import { setBasePath } from '@shoelace-style/shoelace';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@shoelace-style/shoelace/dist/themes/light.css';
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { routes } from 'vue-router/auto-routes';

import App from './App.vue';

setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/');

const app = createApp(App);
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

app.use(router);
app.mount('#app');
