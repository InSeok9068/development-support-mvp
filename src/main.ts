import '@/assets/style.css';
import router from '@/router';
import '@picocss/pico';
// import '@picocss/pico/css/pico.green.min.css';
// import '@picocss/pico/css/pico.violet.min.css';
// import '@picocss/pico/css/pico.zinc.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(router);
app.use(pinia);

app.mount('#app');
