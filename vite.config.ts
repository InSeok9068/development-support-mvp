import Vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import VueDevTools from 'vite-plugin-vue-devtools';
import VueRouter from 'unplugin-vue-router/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
    VueDevTools(),
    Vue(),
    Components({
      dirs: ['src/components/app'],
      dts: true,
    }),
  ],
  build: {
    outDir: 'C://developer-program/nginx-1.25.4/html/',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
