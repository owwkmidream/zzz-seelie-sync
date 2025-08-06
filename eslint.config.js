import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

// 检测是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';

export default [
  // 1. ESLint 推荐的基础规则
  js.configs.recommended,

  // 2. 配置文件专用规则 (例如 vite.config.ts, eslint.config.js 等)
  {
    files: ['*.config.{js,ts}', 'vite.config.{js,ts}', 'eslint.config.{js,ts}'],
    languageOptions: {
    },
    env: {
      node: true, // 启用 Node.js 全局变量 (process, __dirname, __filename, module, require, exports)
      es2021: true, // 启用 ES2021 的全局变量和语法
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // 3. 源代码规则 (你的应用代码，例如 src/app.ts)
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      env: {
        browser: true, // 启用浏览器全局变量 (window, document, MutationObserver, MutationRecord, fetch, etc.)
        es2021: true,  // 启用 ES2021 的全局变量和语法 (Promise, Map, Set, async/await 等)
      },
      globals: {
        // 油猴脚本全局变量
        GM_setValue: 'readonly',
        GM_getValue: 'readonly',
        GM_xmlhttpRequest: 'readonly',
        'GM.xmlHttpRequest': 'readonly',
        unsafeWindow: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript 相关规则
      '@typescript-eslint/no-unused-vars': 'error',
      // 生产环境严格禁止any，开发环境警告
      '@typescript-eslint/no-explicit-any': isProduction ? 'error' : 'warn',

      // 通用规则
      // 生产环境禁止console，开发环境允许
      'no-console': isProduction ? 'error' : 'off',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // 使用 TypeScript 版本，所以禁用 ESLint 自带的
      'no-undef': 'off',      
    },
  },
];
