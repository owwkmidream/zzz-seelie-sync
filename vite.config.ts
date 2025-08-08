import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';
import { resolve } from 'path';
import { execSync } from 'node:child_process';
import { name as packageName, version as packageVersion } from './package.json';

// 版本号处理
let scriptVersion = packageVersion;
if (process.env.RELEASE) {
  // release Actions - 使用 package.json 版本
  scriptVersion = packageVersion;
} else {
  // local & nightly Actions - 使用 git describe
  try {
    const gitDescribe = process.env.GHD_DESCRIBE || execSync('git describe --tags --always --dirty').toString().trim();
    // 移除 dirty 后缀
    const cleanGitDescribe = gitDescribe.replace(/-dirty$/, '');
    // 如果有 tag，格式如 v1.0.0-6-g0230769，去掉 v 前缀
    if (cleanGitDescribe.startsWith('v')) {
      scriptVersion = cleanGitDescribe.slice(1);
      // 将 v1.0.0-6-g0230769 转换为 1.0.0.6-g0230769
      scriptVersion = scriptVersion.replace(/^(\d+\.\d+\.\d+)-/, (_, p1) => `${p1}.`);
    } else {
      // 如果没有 tag，使用 commit hash
      scriptVersion = `${packageVersion}-${cleanGitDescribe}`;
    }
  } catch (_error) {
    // 如果 git 命令失败，使用默认版本
    scriptVersion = `${packageVersion}-dev`;
  }
}

// minify最小化
const isDev = process.env.NODE_ENV === 'development';
const minify = (() => {
  // via argv
  if (process.argv.includes('--minify')) return true
  if (process.argv.includes('--no-minify')) return false

  // env.MINIFY
  if (process.env.MINIFY === 'false') return false
  if (process.env.MINIFY === 'true') return true

  // GreasyFork: default no minify
  if (process.env.RELEASE) return false

  return false
})()

// 构建文件名
const miniSuffix = minify ? '.mini' : ''
const fileName = `${packageName}${miniSuffix}.user.js`
const metaFileName = `${packageName}${miniSuffix}.meta.js`

// 下载和更新 URL
const branchBaseUrl = (branch: string) =>
  `https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/${branch}/`;

let downloadURL: string | undefined;
let updateURL: string | undefined;

if (isDev) {
  // 开发模式不设置 URL
} else if (process.env.RELEASE) {
  // 正式发布
  const baseUrl = branchBaseUrl('release');
  downloadURL = `${baseUrl}${fileName}`;
  updateURL = `${baseUrl}${metaFileName}`;
} else {
  // 夜间构建
  const baseUrl = branchBaseUrl('release-nightly');
  downloadURL = `${baseUrl}${fileName}`;
  updateURL = `${baseUrl}${metaFileName}`;
}

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
        name: 'ZZZ Seelie 数据同步',
        description: '绝区零 Seelie 网站数据同步脚本',
        version: scriptVersion,
        author: 'owwkmidream',
        icon: 'https://zzz.seelie.me/img/logo.svg',
        namespace: 'github.com/owwkmidream',
        supportURL: 'https://github.com/owwkmidream/zzz-seelie-sync/issues',
        homepageURL: 'https://github.com/owwkmidream/zzz-seelie-sync',
        downloadURL,
        updateURL,
        license: 'MIT',
        match: ['https://zzz.seelie.me/*', 'https://do-not-exist.mihoyo.com/'],
        // GM API 权限
        grant: ['GM.xmlHttpRequest', 'GM.cookie'],
        // 允许跨域请求到米哈游API
        connect: [
          'act-api-takumi.mihoyo.com',
          'api-takumi-record.mihoyo.com',
          'public-data-api.mihoyo.com',
          'api-takumi.mihoyo.com'
        ],
        'run-at': 'document-end',
      },
      build: {
        fileName,
        metaFileName: process.env.CI ? metaFileName : undefined,
        autoGrant: true, // 自动检测并添加 @grant
        externalGlobals: {
          ...(minify ? {} : {
            '@trim21/gm-fetch': cdn.jsdelivrFastly('GM_fetch')
          })
        },
      },
    }),
  ],
  build: {
    emptyOutDir: process.env.CI || process.env.KEEP_DIST ? false : true,
    cssMinify: minify,
    minify,
  }
});
