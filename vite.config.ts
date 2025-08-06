import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@logger': resolve(__dirname, 'src/utils/logger.ts')
    }
  },
  plugins: [
    // 油猴脚本配置
    monkey({
      entry: 'src/main.ts',
      server: {
        mountGmApi: true, // 挂载 GM API
      },
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'github.com/owwkmidream',
        match: ['https://zzz.seelie.me/*'],
        // GM API 权限
        grant: ['GM.xmlHttpRequest'],
        // 允许跨域请求到米哈游API
        connect: [
          'act-api-takumi.mihoyo.com',
          'api-takumi-record.mihoyo.com',
          'public-data-api.mihoyo.com',
          'api-takumi.mihoyo.com'
        ],
      },
      build: {
        autoGrant: true, // 自动检测并添加 @grant
        externalGlobals: {
          '@trim21/gm-fetch': cdn.jsdelivr('GM_fetch')
        },
      },
    }),
  ],
});
