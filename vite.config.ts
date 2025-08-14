import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // node_modules/<pkg>/... → pkg 추출
          const parts = id.split('node_modules/')[1].split('/');
          // 스코프 패키지(@scope/pkg) 대응
          const pkg = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
          // 특정 초대형 패키지는 명시적으로 이름 고정
          if (pkg === 'react' || pkg === 'react-dom') return '@react-vendor';
          return `vendor/${pkg}`; // vendor/lodash, vendor/dayjs 식으로 분할
        },
      },
    },
  },
});
