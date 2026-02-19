import Tailwindcss from '@tailwindcss/vite';
import Vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import Components from 'unplugin-vue-components/vite';
import VueRouter from 'unplugin-vue-router/vite';
import { defineConfig } from 'vite';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  plugins: [
    VueRouter(),
    Vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('sl-'),
        },
      },
    }),
    Components({
      dirs: ['src/components/app'],
      dts: true,
    }),
    Tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@packages/ui': fileURLToPath(new URL('../../packages/src/ui', import.meta.url)),
      '@packages/auth': fileURLToPath(new URL('../../packages/src/auth', import.meta.url)),
    },
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
});
