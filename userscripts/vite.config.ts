import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn, util } from 'vite-plugin-monkey';
import AutoImport from 'unplugin-auto-import/vite';
import eslint from '@nabla/vite-plugin-eslint';
import checker from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Vue 支持
    vue(),

    // 自动导入 Vue API 和 GM API
    AutoImport({
      imports: [
        'vue',
        util.unimportPreset, // 自动导入 GM API
      ],
      dts: true, // 生成类型声明文件
    }),

    // ESLint 集成
    eslint({
      eslintOptions: {
        cache: false,
      },
    }),

    // TypeScript 类型检查
    checker({
      typescript: true,
      vueTsc: true,
    }),

    // 油猴脚本配置
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
        match: ['https://www.google.com/'],
        // GM API 权限（自动检测）
        grant: [
          // 'GM_xmlhttpRequest', // 修正：应该是 GM_xmlhttpRequest
          // 'GM_setValue',
          // 'GM_getValue',
        ],
        // 允许跨域请求到任何域名
        connect: ['*'],
      },
      build: {
        autoGrant: true, // 自动检测并添加 @grant
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
          '@trim21/gm-fetch': cdn.jsdelivr('gmFetch', 'dist/index.global.js'),
        },
      },
    }),
  ],
});
