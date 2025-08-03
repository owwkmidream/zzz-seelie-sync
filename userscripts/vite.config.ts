import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn } from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
        match: ['https://www.google.com/'],
        // 添加 @trim21/gm-fetch 需要的权限
        grant: [
          'GM_xmlhttpRequest',
          'GM_setValue',
          'GM_getValue',
        ],
        // 允许跨域请求
        connect: ['*'],
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
          '@trim21/gm-fetch': cdn.jsdelivr('gmFetch', 'dist/index.global.js'),
        },
      },
    }),
  ],
});
