/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,vue}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      width: {
        unset: 'unset',
      },
    },
  },
};
