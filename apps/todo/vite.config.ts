import Tailwindcss from '@tailwindcss/vite';
import Vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import Components from 'unplugin-vue-components/vite';
import VueRouter from 'unplugin-vue-router/vite';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import VueDevTools from 'vite-plugin-vue-devtools';

// https://vitejs.dev/config/
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  plugins: [
    VueRouter(),
    VueDevTools(),
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
    viteStaticCopy({
      targets: [
        {
          src: '../../node_modules/@shoelace-style/shoelace/dist/assets/*',
          dest: 'assets',
        },
      ],
    }),
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
