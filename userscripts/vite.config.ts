import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn, util } from 'vite-plugin-monkey';
import AutoImport from 'unplugin-auto-import/vite';
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
        match: ['https://zzz.seelie.me/*'],
        // GM API 权限
        grant: ['GM.xmlHttpRequest'],
        // 允许跨域请求到米哈游API
        connect: ['act-api-takumi.mihoyo.com'],

      },
      build: {
        autoGrant: true, // 自动检测并添加 @grant
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
          '@trim21/gm-fetch': cdn.jsdelivr('GM_fetch', 'dist/index.global.js')
        },
      },
    }),
  ],
});
