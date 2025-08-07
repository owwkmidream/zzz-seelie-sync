import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

// 检测是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';

export default [
  js.configs.recommended,
  // 配置文件专用规则
  {
    files: ['*.config.{js,ts}', 'vite.config.{js,ts}', 'eslint.config.{js,ts}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // 源代码规则
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // 油猴脚本全局变量
        GM_setValue: 'readonly',
        GM_getValue: 'readonly',
        GM_xmlhttpRequest: 'readonly',
        'GM.xmlHttpRequest': 'readonly',
        unsafeWindow: 'readonly',

        // 浏览器全局变量
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',

        // 定时器函数
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',

        // Web APIs
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        AbortSignal: 'readonly',
        ReadableStream: 'readonly',

        // DOM APIs
        HTMLElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        Event: 'readonly',

        // 其他浏览器APIs
        crypto: 'readonly',
        performance: 'readonly',
        location: 'readonly',
        history: 'readonly',
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
      'no-unused-vars': 'off', // 使用 TypeScript 版本
      'no-undef': 'error',
    },
  },
];