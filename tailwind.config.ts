/** @type {import('tailwindcss').Config} */
export default {
  blocklist: [
    // Pico CSS 사용 클래스명 중복 방지
    'dropdown',
    'secondary',
    'contrast',
    'outline',
    'striped',
    'modal-is-open',
    'modal-is-opening',
    'modal-is-closing',
  ],
};
