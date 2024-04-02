import router from '@/router';
import '@picocss/pico';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createApp } from 'vue';
import App from './App.vue';
import './assets/style.css';

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(router);
app.use(pinia);

app.mount('#app');
